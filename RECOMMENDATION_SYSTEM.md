# TimeArcs Research Recommendation System - Integration Guide

This document describes the new AI-powered researcher recommendation system integrated into TimeArcs.

## New Files Created

### 1. `train_model.ipynb`
- **Purpose**: Train and save the logistic regression model for theme prediction
- **Steps**:
  - Load grants_final.tsv
  - Preprocess titles and themes
  - Train TF-IDF vectorizer
  - Train logistic regression model
  - Save all artifacts to `model_artifacts/` directory
- **How to run**: Open in Jupyter and run all cells
- **Output**: Creates three pickle files in `model_artifacts/`:
  - `logistic_model.pkl`
  - `tfidf_vectorizer.pkl`
  - `label_encoder.pkl`

### 2. `recommend_researchers.py`
- **Purpose**: Recommendation engine for suggesting researchers
- **Key Classes**: `ResearcherRecommendationEngine`
- **Main Function**: `get_recommendations(project_title, target_theme=None, top_n=5)`
- **Features**:
  - Predicts research theme from project title
  - Scores researchers based on:
    - Past projects in same theme
    - Title similarity
    - Contribution level
    - Recency of work
  - Returns top N recommended researchers with scores

### 3. Updated `server.py`
- **New Endpoint**: `POST /recommend_researchers`
- **Parameters**:
  - `project_title` (required): Title of the new project
  - `target_theme` (optional): Manually specify a theme
  - `top_n` (optional): Number of recommendations (default: 5)
- **Response**: JSON with:
  - `project_title`: Input title
  - `predicted_theme`: Automatically determined theme
  - `recommendations`: Array of recommended researchers with scores

### 4. Updated `index.html`
- **New UI Components**:
  - Mode selector: Choose between "Manual Entry" or "AI Recommendation"
  - Recommendation form: Input project title to get recommendations
  - Recommendations display: Shows predicted theme and researcher scores
  - Accept recommendation: Select researchers and add project to database

## Workflow: Using the Recommendation System

### Step 1: Train the Model
1. Open `train_model.ipynb` in Jupyter
2. Run all cells to train and save the model
3. Verify that `model_artifacts/` directory contains the three pickle files

### Step 2: Start the Server
```bash
python server.py
```

### Step 3: Use the Web Interface
1. Open `http://localhost:8000/index.html`
2. Toggle to "AI Recommendation" mode
3. Enter a project title
4. Click "Get Recommendations"
5. The system will:
   - Predict the research theme
   - Display top 5 recommended researchers with their scores
6. Select researchers from the list
7. Enter Code and Year
8. Click "Accept & Add Project" to add to database

## Recommendation Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Theme Matches | 10 pts each | Past projects in the same theme |
| Title Similarity | Up to 50 pts | Cosine similarity with past projects |
| Contribution Score | 0-20 pts | Average contribution in theme projects |
| Recency Bonus | 5 pts each | Recent work (last 3 years) in theme |

## Requirements

- Python 3.7+
- pandas
- numpy
- scikit-learn
- Jupyter (for running train_model.ipynb)

All dependencies are installed automatically by train_model.ipynb

## Troubleshooting

### "Recommendation engine not available"
- Run `train_model.ipynb` to generate model artifacts
- Ensure `model_artifacts/` directory exists with pickle files

### Poor recommendations
- Ensure `grants_final.tsv` has sufficient data (at least 100+ projects)
- Check that researcher names are consistent in the data

### Slow recommendations
- First call loads the models into memory
- Subsequent calls will be faster
- Keep number of projects reasonable (< 10,000)

## Notes

- This is a prototype implementation
- The recommendation quality depends on the quality and quantity of historical grants data
- You can retrain the model anytime by running train_model.ipynb with updated data
- The system works offline once models are trained
