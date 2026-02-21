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
                // Wait for Pyodide to be available globally
                let attempts = 0;
                while (typeof loadPyodide === 'undefined' && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (typeof loadPyodide === 'undefined') {
                    throw new Error('Pyodide failed to load from CDN. Check your internet connection.');
                }
                
                // Load Pyodide from CDN
                const pyodideURL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';
                pyodide = await loadPyodide({ indexURL: pyodideURL });
                
                // Load required packages from Pyodide distribution
                console.log('📦 Loading Python packages (numpy, scikit-learn)...');
                await pyodide.loadPackage(['numpy', 'scikit-learn']);
                console.log('📦 Packages loaded');
                
                // Load the Python recommendation module code
                const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
                console.log('🔧 Base path for model loading:', basePath);
                
                await pyodide.runPythonAsync(`
import pickle
import json
import sys

# Handle numpy._core import compatibility
try:
    import numpy as np
except ImportError:
    import importlib
    sys.modules['numpy._core'] = __import__('numpy')
    import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import base64

# Pass base path from JavaScript
base_path = '${basePath}'

class RecommendationEngine:
    def __init__(self):
        self.vectorizer = None
        self.model = None
        self.label_encoder = None
        self.grants_data = None
        self.base_path = base_path
        
    async def load_models_from_urls(self):
        '''Load models from GitHub Pages paths'''
        import js
        from pyodide.http import pyfetch
        
        print(f"[*] Using base path: {self.base_path}")
        
        try:
            # Load TF-IDF vectorizer using pyfetch
            url = f"{self.base_path}model_artifacts/tfidf_vectorizer.pkl"
            print(f"[*] Fetching: {url}")
            response = await pyfetch(url)
            if not response.ok:
                print(f"[ERROR] Status {response.status}")
                raise Exception(f"HTTP {response.status}")
            vec_bytes = await response.bytes()
            print(f"[*] Received {len(vec_bytes)} bytes")
            self.vectorizer = pickle.loads(vec_bytes)
            print("[✓] Vectorizer loaded")
            
            # Load logistic model
            url = f"{self.base_path}model_artifacts/logistic_model.pkl"
            print(f"[*] Fetching: {url}")
            response = await pyfetch(url)
            if not response.ok:
                print(f"[ERROR] Status {response.status}")
                raise Exception(f"HTTP {response.status}")
            model_bytes = await response.bytes()
            print(f"[*] Received {len(model_bytes)} bytes")
            self.model = pickle.loads(model_bytes)
            print("[✓] Model loaded")
            
            # Load label encoder
            url = f"{self.base_path}model_artifacts/label_encoder.pkl"
            print(f"[*] Fetching: {url}")
            response = await pyfetch(url)
            if not response.ok:
                print(f"[ERROR] Status {response.status}")
                raise Exception(f"HTTP {response.status}")
            encoder_bytes = await response.bytes()
            print(f"[*] Received {len(encoder_bytes)} bytes")
            self.label_encoder = pickle.loads(encoder_bytes)
            print("[✓] Label encoder loaded")
            
            print("[✓] All models loaded successfully!")
            return True
        except Exception as e:
            print(f"[ERROR] Model loading failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def load_grants_data(self):
        '''Load grants data from JSON'''
        from pyodide.http import pyfetch
        
        try:
            url = f"{self.base_path}data/grants_final.json"
            print(f"[*] Loading grants data from {url}...")
            response = await pyfetch(url)
            if not response.ok:
                print(f"[ERROR] Status {response.status}")
                raise Exception(f"HTTP {response.status}")
            import json
            data = await response.json()
            self.grants_data = data
            print(f"[✓] Loaded {len(data)} grants")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to load grants data: {e}")
            import traceback
            traceback.print_exc()
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
            console.log('📥 Loading ML models from model_artifacts/...');
            const result = await py.runPythonAsync(`
import asyncio
try:
    success = await engine.load_models_from_urls()
    success
except Exception as e:
    import traceback
    print(f"Error in load_models_from_urls: {e}")
    traceback.print_exc()
    False
`);
            
            if (!result) {
                console.error('❌ Models failed to load - check console output above for details');
                throw new Error('Failed to load model files from model_artifacts/. Check browser console for details.');
            }
            
            // Also load grants data
            console.log('📥 Loading grants data from data/grants_final.json...');
            const grantsLoaded = await py.runPythonAsync(`
success = await engine.load_grants_data()
success
`);
            
            if (!grantsLoaded) {
                throw new Error('Failed to load grants data from data/grants_final.json');
            }
            
            console.log('✅ All models loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Error loading models:', error);
            throw error;
        }
    }
    
    /**
     * Get recommendations for a project title
     */
    async function getRecommendations(projectTitle, topN = 5) {
        try {
            const py = await initialize();
            
            if (!py) {
                throw new Error('Pyodide not initialized. Please check your internet connection.');
            }
            
            // Predict theme
            const predictResult = await py.runPythonAsync(`
import json
try:
    theme, confidence = engine.predict_theme('${projectTitle.replace(/'/g, "\\'")}')
    json.dumps({'theme': theme, 'confidence': confidence})
except Exception as e:
    json.dumps({'error': str(e)})
`);
            
            const parsed = JSON.parse(predictResult);
            if (parsed.error) {
                throw new Error('Theme prediction failed: ' + parsed.error);
            }
            
            const { theme, confidence } = parsed;
            
            // Get top researchers for this theme
            const recResult = await py.runPythonAsync(`
import json
try:
    recommendations = engine.score_researchers('${theme.replace(/'/g, "\\'")}', top_n=${topN})
    json.dumps(recommendations)
except Exception as e:
    json.dumps({'error': str(e)})
`);
            
            const recs = JSON.parse(recResult);
            if (recs.error) {
                throw new Error('Researcher scoring failed: ' + recs.error);
            }
            
            return {
                project_title: projectTitle,
                predicted_theme: theme,
                theme_confidence: confidence,
                recommendations: Array.isArray(recs) ? recs : [],
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
            console.log('⏳ This may take 30-60 seconds on first load (models are cached afterward)');
            ClientSideRecommendations.loadModels()
                .then(() => {
                    console.log('✅ ML models ready for recommendations');
                })
                .catch(err => {
                    console.error('❌ Could not load ML models:', err.message);
                    console.error('Full error:', err);
                });
        } else {
            console.error('❌ Pyodide not available - AI recommendations will not work');
        }
    } catch (error) {
        console.error('❌ Client-side ML initialization failed:', error);
    }
});
