/**
 * Client-side Recommendations using Pyodide (Python in WebAssembly)
 * 
 * This module runs the ML recommendation engine entirely in the browser
 * by using Pyodide to execute Python code and load scikit-learn models.
 */

const ClientSideRecommendations = (function() {
    let pyodide = null;
    let isInitialized = false;
    let initPromise = null;
    
    /**
     * Initialize Pyodide and load Python dependencies
     */
    async function initialize() {
        if (isInitialized) return pyodide;
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            console.log('🐍 Initializing Pyodide (Python in browser)...');
            
            try {
                // Load Pyodide from CDN
                const pyodideURL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';
                pyodide = await loadPyodide({ indexURL: pyodideURL });
                
                // Install required packages
                console.log('📦 Installing Python packages: numpy, scikit-learn, pandas...');
                await pyodide.loadPackage(['numpy', 'scikit-learn', 'pandas']);
                
                // Load the Python recommendation module code
                await pyodide.runPythonAsync(`
import pickle
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from io import BytesIO
import base64

class RecommendationEngine:
    def __init__(self):
        self.vectorizer = None
        self.model = None
        self.label_encoder = None
        self.grants_data = None
        
    async def load_models_from_urls(self):
        '''Load models from GitHub Pages paths'''
        import js
        
        try:
            # Load TF-IDF vectorizer
            print("[*] Loading TF-IDF vectorizer...")
            resp = await js.fetch('model_artifacts/tfidf_vectorizer.pkl')
            if not resp.ok:
                raise Exception(f"Failed to load tfidf_vectorizer: {resp.status}")
            vec_data = await resp.arrayBuffer()
            self.vectorizer = pickle.loads(bytes(vec_data))
            print("[✓] Vectorizer loaded")
            
            # Load logistic model
            print("[*] Loading logistic regression model...")
            resp = await js.fetch('model_artifacts/logistic_model.pkl')
            if not resp.ok:
                raise Exception(f"Failed to load logistic_model: {resp.status}")
            model_data = await resp.arrayBuffer()
            self.model = pickle.loads(bytes(model_data))
            print("[✓] Model loaded")
            
            # Load label encoder
            print("[*] Loading label encoder...")
            resp = await js.fetch('model_artifacts/label_encoder.pkl')
            if not resp.ok:
                raise Exception(f"Failed to load label_encoder: {resp.status}")
            encoder_data = await resp.arrayBuffer()
            self.label_encoder = pickle.loads(bytes(encoder_data))
            print("[✓] Label encoder loaded")
            
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load models: {e}")
            return False
    
    async def load_grants_data(self):
        '''Load grants data from JSON'''
        import js
        
        try:
            print("[*] Loading grants data...")
            resp = await js.fetch('data/grants_final.json')
            if not resp.ok:
                raise Exception(f"Failed to load grants data: {resp.status}")
            data = await resp.json()
            self.grants_data = data
            print(f"[✓] Loaded {len(data)} grants")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load grants data: {e}")
            return False
    
    def predict_theme(self, project_title):
        '''Predict research theme from project title'''
        if not self.vectorizer or not self.model:
            raise Exception("Models not loaded")
        
        # Vectorize input
        X = self.vectorizer.transform([project_title])
        
        # Predict theme
        theme_idx = self.model.predict(X)[0]
        confidence = float(self.model.predict_proba(X)[0].max())
        
        # Decode theme
        theme = self.label_encoder.inverse_transform([theme_idx])[0]
        
        return theme, confidence
    
    def get_researchers_by_theme(self, theme):
        '''Get all researchers who have worked on this theme'''
        researchers = {}
        
        for grant in self.grants_data:
            if grant.get('theme') == theme:
                authors = grant.get('authors', '')
                for author in authors.split(','):
                    author = author.strip()
                    if author:
                        if author not in researchers:
                            researchers[author] = {
                                'name': author,
                                'theme_projects': 0,
                                'total_projects': 0,
                                'projects': []
                            }
                        researchers[author]['theme_projects'] += 1
                        researchers[author]['projects'].append(grant)
        
        # Count total projects for each researcher
        for grant in self.grants_data:
            authors = grant.get('authors', '')
            for author in authors.split(','):
                author = author.strip()
                if author in researchers:
                    researchers[author]['total_projects'] += 1
        
        return researchers
    
    def score_researchers(self, theme, top_n=5):
        '''Score researchers for a theme'''
        researchers = self.get_researchers_by_theme(theme)
        
        # Simple scoring: theme relevance + project count
        scored = []
        for name, data in researchers.items():
            # Score formula: (theme_projects * 30) + (total_projects * 10)
            score = (data['theme_projects'] * 30) + (data['total_projects'] * 10)
            scored.append({
                'researcher': name,
                'score': score,
                'theme_projects': data['theme_projects'],
                'total_projects': data['total_projects']
            })
        
        # Sort by score
        scored.sort(key=lambda x: x['score'], reverse=True)
        
        return scored[:top_n]

# Create global engine instance
engine = RecommendationEngine()
`);
                
                console.log('✓ Python environment ready');
                isInitialized = true;
                return pyodide;
                
            } catch (error) {
                console.error('Failed to initialize Pyodide:', error);
                throw error;
            }
        })();
        
        return initPromise;
    }
    
    /**
     * Load ML models into the Python environment
     */
    async function loadModels() {
        const py = await initialize();
        
        try {
            console.log('📥 Loading ML models...');
            const result = await py.runPythonAsync(`
import asyncio
success = await engine.load_models_from_urls()
success
`);
            
            if (!result) {
                throw new Error('Failed to load models from URLs');
            }
            
            // Also load grants data
            const grantsLoaded = await py.runPythonAsync(`
success = await engine.load_grants_data()
success
`);
            
            if (!grantsLoaded) {
                throw new Error('Failed to load grants data');
            }
            
            console.log('✅ All models loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }
    
    /**
     * Get recommendations for a project title
     */
    async function getRecommendations(projectTitle, topN = 5) {
        try {
            const py = await initialize();
            
            // Predict theme
            const predictResult = await py.runPythonAsync(`
import json
theme, confidence = engine.predict_theme('${projectTitle.replace(/'/g, "\\'")}')
json.dumps({'theme': theme, 'confidence': confidence})
`);
            
            const { theme, confidence } = JSON.parse(predictResult);
            
            // Get top researchers for this theme
            const recResult = await py.runPythonAsync(`
import json
recommendations = engine.score_researchers('${theme.replace(/'/g, "\\'")}', top_n=${topN})
json.dumps(recommendations)
`);
            
            const recommendations = JSON.parse(recResult);
            
            return {
                project_title: projectTitle,
                predicted_theme: theme,
                theme_confidence: confidence,
                recommendations: recommendations,
                source: 'client-side-ml'
            };
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }
    
    /**
     * Check if client-side ML is available
     */
    async function isAvailable() {
        try {
            await initialize();
            return pyodide !== null;
        } catch (e) {
            return false;
        }
    }
    
    return {
        initialize,
        loadModels,
        getRecommendations,
        isAvailable
    };
})();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const available = await ClientSideRecommendations.isAvailable();
        if (available) {
            console.log('🐍 Pyodide available - loading ML models...');
            ClientSideRecommendations.loadModels().then(() => {
                console.log('✅ ML models ready for recommendations');
            }).catch(err => {
                console.warn('⚠ Could not load ML models:', err.message);
            });
        } else {
            console.warn('⚠ Pyodide not available');
        }
    } catch (error) {
        console.warn('⚠ Client-side ML initialization skipped');
    }
});
