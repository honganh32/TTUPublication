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
            // Prepare input
            const input = new ort.Tensor('string', [[text]], [1, 1]);
            
            // Run inference
            const results = await tfidfSession.run({ string_input: input });
            
            // Extract output features
            const outputKey = Object.keys(results)[0];
            const features = results[outputKey].data;
            
            return Array.from(features);
        } catch (error) {
            console.error('TF-IDF vectorization failed:', error);
            throw error;
        }
    }
    
    // Predict theme from text
    async function predictTheme(projectTitle) {
        if (!session || !labelEncoder) {
            throw new Error('Models not initialized');
        }
        
        try {
            // 1. Vectorize the input text
            const features = await vectorizeText(projectTitle);
            
            // 2. Create input tensor
            const input = new ort.Tensor('float32', features, [1, features.length]);
            
            // 3. Run logistic regression model
            const results = await session.run({ float_input: input });
            
            // 4. Get predicted probabilities
            const outputKey = Object.keys(results)[0];
            const probabilities = results[outputKey].data;
            
            // 5. Get predicted class index and class name
            let maxProb = 0;
            let predictedIdx = 0;
            
            for (let i = 0; i < probabilities.length; i++) {
                if (probabilities[i] > maxProb) {
                    maxProb = probabilities[i];
                    predictedIdx = i;
                }
            }
            
            const predictedTheme = labelEncoder.classes[predictedIdx];
            const confidence = (maxProb * 100).toFixed(1);
            
            return {
                theme: predictedTheme,
                confidence: confidence,
                probabilities: Array.from(probabilities),
                allThemes: labelEncoder.classes
            };
        } catch (error) {
            console.error('Theme prediction failed:', error);
            throw error;
        }
    }
    
    // Get researchers for a theme from grants data
    function getResearchersForTheme(theme, grantsData) {
        if (!grantsData || !Array.isArray(grantsData)) {
            return [];
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
            
            // Contribution score (how many projects overall)
            data.breakdown.contribution_score = Math.min(data.total_projects * 5, 50);
            
            // Recency bonus (recent projects weighted more - simplified)
            data.breakdown.recency_score = 10;
            
            // Total score
            data.score = data.breakdown.theme_score + 
                        data.breakdown.contribution_score + 
                        data.breakdown.recency_score;
        }
        
        // Sort by score and return top researchers
        const sorted = Object.values(researcherScores)
            .sort((a, b) => b.score - a.score);
        
        return sorted;
    }
    
    // Main function: get recommendations for a project
    async function getRecommendations(projectTitle, grantsData, topN = 5) {
        if (!await initialize()) {
            throw new Error('Recommendation engine not initialized. Check browser console for errors.');
        }
        
        try {
            // 1. Predict the theme
            const prediction = await predictTheme(projectTitle);
            
            console.log(`Predicted theme: "${prediction.theme}" (${prediction.confidence}% confidence)`);
            
            // 2. Get researchers for this theme
            const researchers = getResearchersForTheme(prediction.theme, grantsData);
            
            // 3. Return top N researchers
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
