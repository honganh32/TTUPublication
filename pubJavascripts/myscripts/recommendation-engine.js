/**
 * Real-time Recommendation Engine using ONNX Models
 * 
 * Loads scikit-learn models converted to ONNX format and runs
 * recommendation inference directly in the browser.
 */

const RecommendationEngine = (function() {
    let session = null;
    let tfidfSession = null;
    let labelEncoder = null;
    let isInitialized = false;
    let initPromise = null;
    
    // Load ONNX model
    async function loadSession(modelPath) {
        try {
            // Session creation automatically downloads and loads the onnx model
            const session = await ort.InferenceSession.create(modelPath, { 
                executionProviders: ['wasm', 'cpu'] 
            });
            return session;
        } catch (error) {
            console.error(`Failed to load model ${modelPath}:`, error);
            throw error;
        }
    }
    
    // Initialize models (call once at startup)
    async function initialize() {
        if (isInitialized && session) {
            return true;
        }
        
        if (initPromise) {
            return await initPromise;
        }
        
        initPromise = (async () => {
            try {
                console.log('Initializing recommendation engine...');
                
                // Load both models
                tfidfSession = await loadSession('model_artifacts/tfidf_vectorizer.onnx');
                session = await loadSession('model_artifacts/logistic_model.onnx');
                
                // Load label encoder mapping
                const response = await fetch('model_artifacts/label_encoder.json');
                if (!response.ok) {
                    throw new Error('Failed to load label encoder');
                }
                labelEncoder = await response.json();
                
                isInitialized = true;
                console.log('✓ Recommendation engine ready');
                console.log('  Available themes:', labelEncoder.classes);
                
                return true;
            } catch (error) {
                console.error('Failed to initialize recommendation engine:', error);
                isInitialized = false;
                return false;
            }
        })();
        
        return await initPromise;
    }
    
    // Convert text to TF-IDF features
    async function vectorizeText(text) {
        if (!tfidfSession) {
            throw new Error('TF-IDF vectorizer not loaded');
        }
        
        try {
            // Get input/output names from the model
            const inputs = tfidfSession.inputNames;
            const inputName = inputs[0];
            
            // Create 2D string tensor [1, 1] with flat data array
            // IMPORTANT: For ONNX.js string tensors, data must be a flat array
            const input = new ort.Tensor('string', [text], [1, 1]);
            
            // Create input object with the correct key
            const inputObj = {};
            inputObj[inputName] = input;
            
            console.log('TF-IDF Input:', { inputName, shape: [1, 1], text });
            
            // Run inference
            const results = await tfidfSession.run(inputObj);
            
            // Extract output features (get first output)
            const outputs = tfidfSession.outputNames;
            const outputName = outputs[0];
            const features = results[outputName].data;
            
            console.log('TF-IDF Output:', { outputName, featureCount: features.length });
            
            return Array.from(features);
        } catch (error) {
            console.error('TF-IDF vectorization failed:', error);
            throw error;
        }
    }
    
    // Calculate cosine similarity between two vectors
    function cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            console.warn('Vector length mismatch:', vec1.length, 'vs', vec2.length);
            return 0;
        }
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }
        
        return dotProduct / (norm1 * norm2);
    }
    
    // Predict theme from text
    async function predictTheme(projectTitle) {
        if (!session || !labelEncoder) {
            throw new Error('Models not initialized');
        }
        
        try {
            // 1. Vectorize the input text
            const features = await vectorizeText(projectTitle);
            
            // 2. Get input name from the model
            const inputs = session.inputNames;
            const inputName = inputs[0];
            
            // 3. Create input tensor with correct shape [1, features.length]
            const input = new ort.Tensor('float32', features, [1, features.length]);
            
            // 4. Create input object with the correct key
            const inputObj = {};
            inputObj[inputName] = input;
            
            console.log('Logistic Regression Input:', { 
                inputName, 
                shape: [1, features.length], 
                featureCount: features.length 
            });
            
            // 5. Get output names first (before running to avoid fetching non-tensor types)
            const outputs = session.outputNames;
            console.log('Model output names:', outputs);
            
            // 6. Run logistic regression model, specifying which outputs to fetch
            // This prevents errors from trying to fetch non-tensor outputs (like string labels)
            let results;
            try {
                // Try fetching all outputs first (ONNX will skip non-tensor ones)
                results = await session.run(inputObj, outputs);
            } catch (runError) {
                console.warn('Failed to fetch all outputs:', runError.message);
                // Fallback: try fetching just the first output
                console.log('Attempting to fetch first output only...');
                try {
                    results = await session.run(inputObj, [outputs[0]]);
                    console.warn('⚠️ Warning: Using only first output due to output fetch error');
                } catch (fallbackError) {
                    throw new Error(`Cannot fetch model outputs: ${runError.message}`);
                }
            }
            
            // Safely iterate through outputs
            // 7. Get output details
            
            const outputDetails = {};
            for (const name of outputs) {
                try {
                    const outputValue = results[name];
                    outputDetails[name] = {
                        hasData: !!outputValue.data,
                        type: outputValue.type,
                        dims: outputValue.dims,
                        dataLength: outputValue.data ? outputValue.data.length : 'N/A'
                    };
                } catch (e) {
                    outputDetails[name] = { error: e.message };
                }
            }
            console.log('Returned output details:', outputDetails);
            
            // Strategy: Try to get predicted class from outputs
            // 1. First, look for output_label (int64) - direct prediction
            // 2. Fall back to probabilities (float32) - compute max
            
            let predictedIdx = null;
            let maxProb = 0.95; // Default confidence when using direct label
            let foundProbabilities = false;
            
            // First try to find direct label output (output_label)
            for (const outputName of outputs) {
                try {
                    const output = results[outputName];
                    
                    if (output && output.data) {
                        console.log(`Output "${outputName}": type=${output.type}, dims=${JSON.stringify(output.dims)}, size=${output.data.length}`);
                        
                        // Check for direct class label (int64, single value)
                        if ((output.type === 'int64' || output.type === 'int32') && output.data.length === 1) {
                            predictedIdx = Number(output.data[0]);
                            console.log(`✓ Using output "${outputName}" as predicted class index: ${predictedIdx}`);
                            break;
                        }
                        
                        // Check for probabilities (float32, multiple values)
                        if (output.type === 'float32' && output.data.length >= 10) {
                            const probabilities = output.data;
                            foundProbabilities = true;
                            
                            // Find max probability
                            for (let i = 0; i < probabilities.length; i++) {
                                if (probabilities[i] > maxProb) {
                                    maxProb = probabilities[i];
                                    predictedIdx = i;
                                }
                            }
                            console.log(`✓ Using output "${outputName}" as probabilities (predicted index: ${predictedIdx}, confidence: ${(maxProb * 100).toFixed(1)}%)`);
                            break;
                        }
                    } else {
                        console.log(`Output "${outputName}": skipped (not a tensor)`);
                    }
                } catch (e) {
                    console.log(`Output "${outputName}": error -`, e.message);
                }
            }
            
            // Validate we got a prediction
            if (predictedIdx === null) {
                throw new Error('Could not extract predicted class from model outputs. Check console for details.');
            }
            
            // Get the theme name from label encoder
            const predictedTheme = labelEncoder.classes[predictedIdx];
            const confidence = (maxProb * 100).toFixed(1);
            
            console.log('Prediction Result:', { 
                theme: predictedTheme, 
                classIndex: predictedIdx,
                confidence: confidence + '%',
                source: foundProbabilities ? 'probabilities' : 'direct_label'
            });
            
            return {
                theme: predictedTheme,
                confidence: confidence,
                probabilities: null,
                allThemes: labelEncoder.classes
            };
        } catch (error) {
            console.error('Theme prediction failed:', error);
            throw error;
        }
    }
    
    // Get researchers for a theme from grants data
    async function getResearchersForTheme(theme, grantsData, projectTitle) {
        if (!grantsData || !Array.isArray(grantsData)) {
            return [];
        }
        
        // Vectorize the input project title for similarity comparison
        let inputVector = null;
        try {
            inputVector = await vectorizeText(projectTitle);
            console.log(`Vectorized input title for keyword matching`);
        } catch (error) {
            console.warn('Could not vectorize input title for keyword matching:', error);
        }
        
        // Find all researchers who have worked in this theme
        const researcherScores = {};
        
        for (const grant of grantsData) {
            if (grant.theme === theme) {
                // Parse authors
                const authors = (grant.authors || '').split(',').map(a => a.trim());
                
                for (const author of authors) {
                    if (author) {
                        if (!researcherScores[author]) {
                            researcherScores[author] = {
                                researcher: author,
                                score: 0,
                                theme_projects: 0,
                                total_projects: 0,
                                projects: [],
                                titleVectors: [], // Store vectorized titles
                                breakdown: {
                                    theme_score: 0,
                                    keyword_score: 0,
                                    contribution_score: 0,
                                    recency_score: 0
                                }
                            };
                        }
                        researcherScores[author].theme_projects += 1;
                        researcherScores[author].projects.push(grant.title);
                        
                        // Vectorize the project title for this researcher
                        if (inputVector) {
                            try {
                                const titleVector = await vectorizeText(grant.title);
                                researcherScores[author].titleVectors.push({
                                    title: grant.title,
                                    vector: titleVector
                                });
                            } catch (e) {
                                // Skip if vectorization fails for this title
                            }
                        }
                    }
                }
            }
        }
        
        // Count total projects for each researcher
        for (const grant of grantsData) {
            const authors = (grant.authors || '').split(',').map(a => a.trim());
            for (const author of authors) {
                if (researcherScores[author]) {
                    researcherScores[author].total_projects += 1;
                }
            }
        }
        
        // Calculate scores
        for (const researcher in researcherScores) {
            const data = researcherScores[researcher];
            
            // Theme match score (primary factor)
            data.breakdown.theme_score = data.theme_projects * 30;
            
            // Keyword similarity score (TF-IDF cosine similarity with input title)
            if (inputVector && data.titleVectors.length > 0) {
                let maxSimilarity = 0;
                let bestMatchTitle = '';
                
                for (const titleData of data.titleVectors) {
                    const similarity = cosineSimilarity(inputVector, titleData.vector);
                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        bestMatchTitle = titleData.title;
                    }
                }
                
                // Exact match detection (threshold >= 0.85)
                if (maxSimilarity >= 0.85) {
                    // High similarity: exact or near-exact match
                    // Apply multiplier similar to Python version (150-200x boost)
                    data.breakdown.keyword_score = maxSimilarity * 200;
                    console.log(`High similarity match found for ${researcher}: "${bestMatchTitle}" (${maxSimilarity.toFixed(3)})`);
                } else if (maxSimilarity > 0.2) {
                    // Partial keyword match
                    data.breakdown.keyword_score = maxSimilarity * 50;
                } else {
                    // Low similarity
                    data.breakdown.keyword_score = 0;
                }
            }
            
            // Contribution score (how many projects overall)
            data.breakdown.contribution_score = Math.min(data.total_projects * 5, 50);
            
            // Recency bonus (recent projects weighted more - simplified)
            data.breakdown.recency_score = 10;
            
            // Total score
            data.score = data.breakdown.theme_score + 
                        data.breakdown.keyword_score + 
                        data.breakdown.contribution_score + 
                        data.breakdown.recency_score;
        }
        
        // Sort by score and return top researchers
        const sorted = Object.values(researcherScores)
            .sort((a, b) => b.score - a.score);
        
        return sorted;
    }
    
    // Load grants data from TSV file
    async function loadGrantsData(tsvPath) {
        return new Promise((resolve, reject) => {
            d3.tsv(tsvPath, function(error, data) {
                if (error) {
                    reject(error);
                } else {
                    // Merge with locally added projects (if available)
                    if (typeof getLocalProjects === 'function') {
                        const localProjects = getLocalProjects();
                        if (localProjects.length > 0) {
                            console.log(`[recommendation-engine] Merging ${localProjects.length} locally added projects`);
                            data = data.concat(localProjects);
                        }
                    }
                    
                    // Normalize data keys to lowercase for consistency
                    const normalizedData = data.map(row => ({
                        code: row.Code || row.code || '',
                        time: row.Time || row.time || '',
                        theme: row.Theme || row.theme || '',
                        title: row.Title || row.title || '',
                        authors: row.Authors || row.authors || ''
                    }));
                    resolve(normalizedData);
                }
            });
        });
    }
    
    // Main function: get recommendations for a project
    async function getRecommendations(projectTitle, tsvPath, topN = 5) {
        if (!await initialize()) {
            throw new Error('Recommendation engine not initialized. Check browser console for errors.');
        }
        
        try {
            // 1. Load grants data
            console.log(`Loading grants data from ${tsvPath}...`);
            const grantsData = await loadGrantsData(tsvPath);
            console.log(`Loaded ${grantsData.length} grants`);
            
            // 2. Predict the theme
            const prediction = await predictTheme(projectTitle);
            
            console.log(`Predicted theme: "${prediction.theme}" (${prediction.confidence}% confidence)`);
            
            // 3. Get researchers for this theme (with keyword similarity)
            const researchers = await getResearchersForTheme(prediction.theme, grantsData, projectTitle);
            
            // 4. Return top N researchers
            const topResearchers = researchers.slice(0, topN);
            
            return {
                project_title: projectTitle,
                predicted_theme: prediction.theme,
                confidence: prediction.confidence,
                recommendations: topResearchers,
                source: 'onnx-browser'
            };
        } catch (error) {
            console.error('Recommendation failed:', error);
            throw error;
        }
    }
    
    // Check if models are available
    async function isAvailable() {
        try {
            const response = await fetch('model_artifacts/logistic_model.onnx', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    return {
        initialize,
        getRecommendations,
        predictTheme,
        getResearchersForTheme,
        loadGrantsData,
        isAvailable
    };
})();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    const available = await RecommendationEngine.isAvailable();
    if (available) {
        console.log('Loading ONNX recommendation models...');
        RecommendationEngine.initialize().catch(err => {
            console.warn('Note: ONNX models not available. Falling back to precomputed recommendations.');
        });
    } else {
        console.log('ONNX models not found. Using precomputed recommendations instead.');
    }
});
