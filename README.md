# TTUPublication - Researcher Recommendation System for TimeArcs

A machine learning-powered researcher recommendation system that predicts research themes and recommends qualified researchers for new projects based on historical grant data.

## 🚀 Deployment Options

- **🌐 GitHub Pages** (Recommended): Static hosting with client-side AI - [Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)
- **💻 Local Server**: Python-based server for development - [Setup Guide](SERVER_SETUP.md)

## Features

- 🤖 **Theme Prediction**: Automatically predicts research themes using trained ML models (ONNX/browser or Python)
- 👥 **Researcher Recommendations**: Recommends researchers based on past project experience and theme matching
- 📊 **Score Breakdown**: Shows detailed scoring breakdown (theme match, keyword similarity, contribution, recency)
- 📄 **Related Papers**: Lists researcher's papers in the target theme
- 🎯 **Improved Scoring**: Boosts scores for papers closely related to input topics
- ⚙️ **Small Dataset Optimization**: Implements best practices for training with limited data

## System Architecture

```
TTUPublication/
├── index.html                 # Web UI with recommendation interface
├── server.py                  # HTTP server with recommendation API
├── recommend_researchers.py   # Core recommendation engine
├── train_model.ipynb         # ML model training notebook
├── grants_final.tsv          # Training data (research projects/themes)
├── model_artifacts/          # Trained model files
│   ├── logistic_model.pkl
│   ├── tfidf_vectorizer.pkl
│   └── label_encoder.pkl
├── pubJavascripts/           # Publication-related JavaScript
├── Research_theme_assignment.ipynb  # Theme assignment notebook
└── SERVER_SETUP.md           # Server setup instructions
```

## Quick Start

### Option 1: GitHub Pages (Static Hosting) 🌐

Perfect for production deployment with no server maintenance!

1. **Convert models to ONNX format:**
   ```bash
   pip install skl2onnx onnx onnxruntime scikit-learn
   python convert_models_to_onnx.py
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add model_artifacts/*.onnx model_artifacts/label_encoder.json
   git commit -m "Add ONNX models for GitHub Pages"
   git push origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source
   - Wait for deployment to complete

4. **Access your site:**
   ```
   https://yourusername.github.io/TTUPublication/index.html
   ```

📖 **[Full GitHub Pages Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)**

### Option 2: Local Python Server (Development) 💻

Best for development and testing.

**Prerequisites:**
- Python 3.7+
- scikit-learn, pandas, numpy
- Web browser

**Installation:**

1. Clone the repository
```bash
git clone https://github.com/yourusername/TTUPublication.git
cd TTUPublication
```

2. Install dependencies
```bash
pip install pandas numpy scikit-learn
```

3. Train the models (optional - pre-trained models included)
```bash
jupyter notebook train_model.ipynb
# Run all cells to retrain models
```

4. Start the local server
```bash
python server.py
```

5. Open in browser
```
http://localhost:8000/index.html
```

## Usage

### Web Interface

1. **Select Mode**: Choose between "Manual Entry" or "AI Recommendation"
2. **AI Recommendation Mode**:
   - Enter a project title (e.g., "Quantum Computing")
   - System predicts theme automatically
   - View top 5 recommended researchers with scores
   - Click "View" to see score breakdown and related papers
   - Select researchers and add project to database

3. **Manual Entry Mode**:
   - Specify all project details manually
   - Select researchers from list
   - Add project to database

### API Endpoint

```bash
curl -X POST http://localhost:8000/recommend_researchers \
  -d "project_title=Machine Learning&top_n=5"
```

**Response:**
```json
{
  "project_title": "Machine Learning",
  "predicted_theme": "AI / Machine Learning",
  "recommendations": [
    {
      "researcher": "Victor Sheng",
      "score": 141.74,
      "theme_projects": 9,
      "total_projects": 16,
      "breakdown": {
        "theme_score": 90.0,
        "keyword_score": 13.78,
        "contribution_score": 7.96,
        "recency_score": 30.0
      },
      "related_papers": ["Paper 1", "Paper 2", ...]
    }
  ]
}
```

## Model Details

### Theme Prediction Model
- **Algorithm**: Logistic Regression with TF-IDF features
- **Feature Engineering**: 1000 TF-IDF features, class balancing
- **Training Data**: 48 research project titles across 10 themes
- **Cross-validation Accuracy**: 45.78% (±9.72%)
- **Optimization**: Stratified K-Fold, class weighting, regularization

### Recommendation Scoring

Score breakdown for each researcher:

1. **Theme Match**
   - 10 points per past project in target theme

2. **Keyword/Title Similarity**
   - Uses TF-IDF similarity between new project title and researcher's past titles.
      • Exact/near-exact match (≥85% similar): similarity × 200
      • Partial match (>20% similar): similarity × 50
      • Low similarity (≤20%): 0 points

3. **Contribution Score**
   - 5 points per each completed project (cap at 50)

4. **Recency Bonus**
   - 10 points per recent project (last 4 years)

## Training Data Improvements

### Current Dataset
- **Size**: 48 samples (55 before filtering)
- **Classes**: 10 research themes
- **Imbalance**: Education themed projects are 31% of data
- **Issue**: Very limited data for some themes (Quantum: 3 samples)

### Recommendations for Improvement

1. **Collect More Data** (highest priority)
   - Target: 20+ samples per class (200-500 total)
   - Impact: +20-40% accuracy improvement

2. **Data Augmentation**
   - Create synthetic variations of titles
   - 2-3x dataset size without new collection
   - Impact: +10-15% accuracy

3. **Transfer Learning**
   - Use pre-trained embeddings (BERT, Word2Vec)
   - Better performance with small datasets
   - Impact: +10-20% accuracy

4. **Feature Engineering**
   - Add domain-specific keywords
   - Track research focus areas
   - Impact: +5-10% accuracy

See [SMALL_DATASET_GUIDE.md](SMALL_DATASET_GUIDE.md) for detailed strategies.

## File Descriptions

### Core Files
- **index.html**: Main user interface with recommendation forms and visualization
- **server.py**: HTTP server handling requests with `/recommend_researchers` endpoint
- **recommend_researchers.py**: Recommendation engine with scoring logic
- **train_model.ipynb**: Jupyter notebook for training theme prediction model

### Data Files
- **grants_final.tsv**: Research project database (Code, Year, Theme, Title, Authors)
- **model_artifacts/**: Serialized trained models for production use

### Documentation
- **README.md**: This file
- **SERVER_SETUP.md**: Detailed server configuration
- **SMALL_DATASET_GUIDE.md**: Guide for improving models with limited training data
- **MODEL_IMPROVEMENTS.md**: Summary of recent model improvements

## Performance Metrics

### Model Performance
| Metric | Value |
|--------|-------|
| Training Accuracy | 95.83% |
| Cross-validation Accuracy | 45.78% ± 9.72% |
| Overfitting Gap | Large (indicates more data needed) |

### Recent Improvements
✅ Reduced overfitting with class weighting and regularization
✅ Implemented cross-validation for reliable estimates
✅ Added ensemble methods for variance reduction
✅ Included related papers in recommendations
✅ Boosted scores for closely related papers

## Troubleshooting

### Server Issues
```bash
# Port 8000 already in use?
# Kill process using port 8000:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port (edit server.py)
PORT = 8001
```

### Model Loading Issues
```bash
# If models not found, retrain:
jupyter notebook train_model.ipynb
# Run all cells to generate model_artifacts/
```

### Prediction Issues
- "Quantum" still predicting wrong theme? → Run train_model.ipynb to retrain
- Poor recommendations? → Check recommendation/recommend_researchers.py scoring weights

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Make changes and test locally
4. Commit with clear messages (`git commit -m "Add feature X"`)
5. Push to branch (`git push origin feature/improvement`)
6. Open Pull Request

### Testing Recommendations
```bash
# Test API endpoint
python recommend_researchers.py "Your test title"

# Test with exact dataset paper
python test_scoring.py

# Compare old vs new model
python diagnose_model.py
```

## Future Enhancements

- [ ] Add more training data (target: 200+ samples)
- [ ] Implement transfer learning with BERT embeddings
- [ ] Add data augmentation pipeline
- [ ] Create admin panel for model retraining
- [ ] Add feedback mechanism for prediction improvement
- [ ] Implement A/B testing for scoring weights
- [ ] Add theme-specific recommendation rules
- [ ] Create researcher profile pages with analytics

## License

This project is part of the TimeArcs visualization platform. Contact TTU for licensing information.

## Authors

- Model improvements and ML optimization: Feb 2026
- Initial system design: Earlier development

## Contact & Support

For issues, questions, or suggestions:
- Check [SMALL_DATASET_GUIDE.md](SMALL_DATASET_GUIDE.md) for model improvement strategies
- Review [SERVER_SETUP.md](SERVER_SETUP.md) for deployment details
- See docstrings in `recommend_researchers.py` for API documentation

## Acknowledgments

- TTU School of Computing
- TimeArcs visualization framework
- scikit-learn team for ML tools
