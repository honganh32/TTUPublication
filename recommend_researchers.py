#!/usr/bin/env python3
"""
Researcher Recommendation Engine

This module loads pre-trained ML models and provides researcher recommendations
based on project titles and themes.
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json


class ResearcherRecommendationEngine:
    """Engine for recommending researchers based on project details"""
    
    def __init__(self, grants_file='grants_final.tsv', model_dir='model_artifacts', current_year=2026):
        """
        Initialize the recommendation engine with pre-trained models.
        
        Args:
            grants_file: Path to the grants data file
            model_dir: Directory containing saved model artifacts
            current_year: Current year for recency calculations
        """
        self.current_year = current_year
        self.grants_file = grants_file
        self.model_dir = model_dir
        
        # Load model artifacts
        self._load_models()
        
        # Load and parse grants data
        self._load_grants_data()
        
        # Build researcher profiles
        self._build_researcher_profiles()
        
        # Initialize title similarity
        self._initialize_title_similarity()
    
    def _load_models(self):
        """Load pre-trained model artifacts from disk"""
        try:
            model_path = os.path.join(self.model_dir, 'logistic_model.pkl')
            vectorizer_path = os.path.join(self.model_dir, 'tfidf_vectorizer.pkl')
            encoder_path = os.path.join(self.model_dir, 'label_encoder.pkl')
            
            with open(model_path, 'rb') as f:
                self.logistic_model = pickle.load(f)
            
            with open(vectorizer_path, 'rb') as f:
                self.tfidf_vectorizer = pickle.load(f)
            
            with open(encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
            
            print("[OK] Models loaded successfully")
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Model artifacts not found: {e}. Please run train_model.ipynb first.")
    
    def _load_grants_data(self):
        """Load and preprocess grants data"""
        df = pd.read_csv(self.grants_file, sep='\t')
        
        # Rename columns to match expected format
        if 'Authors' in df.columns:
            df = df.rename(columns={'Authors': 'Researchers'})
        if 'Code' in df.columns:
            df = df.rename(columns={'Code': 'ProposalNo'})
        if 'Time' in df.columns:
            df = df.rename(columns={'Time': 'Year'})
        
        # Clean data
        df['Title'] = df['Title'].str.strip('"')
        df['Theme'] = df['Theme'].str.strip("'")
        df['Researchers'] = df['Researchers'].str.strip("'")
        
        self.grants_df = df
    
    def _build_researcher_profiles(self):
        """Build researcher profiles from grants data"""
        self.researcher_profiles = {}
        
        # Parse researchers (comma-separated)
        for _, row in self.grants_df.iterrows():
            researchers = [r.strip().strip("'") for r in str(row['Researchers']).split(',')]
            num_researchers = len(researchers)
            contribution = 100.0 / num_researchers
            
            for researcher in researchers:
                if researcher not in self.researcher_profiles:
                    self.researcher_profiles[researcher] = {
                        'projects': [],
                        'themes': [],
                        'theme_counts': {},
                        'titles': []
                    }
                
                self.researcher_profiles[researcher]['projects'].append({
                    'title': row['Title'],
                    'theme': row['Theme'],
                    'year': row['Year'],
                    'contribution': contribution
                })
                self.researcher_profiles[researcher]['themes'].append(row['Theme'])
                self.researcher_profiles[researcher]['titles'].append(row['Title'])
                self.researcher_profiles[researcher]['theme_counts'][row['Theme']] = \
                    self.researcher_profiles[researcher]['theme_counts'].get(row['Theme'], 0) + 1
    
    def _initialize_title_similarity(self):
        """Initialize TF-IDF for title similarity matching"""
        all_titles = self.grants_df['Title'].tolist()
        self.title_tfidf = TfidfVectorizer(stop_words='english', max_features=500)
        self.title_vectors = self.title_tfidf.fit_transform(all_titles)
        self.title_to_idx = {title: idx for idx, title in enumerate(all_titles)}
    
    def _get_top_predicted_themes(self, text, k=2):
        """Predict top k themes for given text"""
        X_new = self.tfidf_vectorizer.transform([text])
        probabilities = self.logistic_model.predict_proba(X_new)[0]
        top_k_indices = np.argsort(probabilities)[::-1][:k]
        top_k_themes = self.label_encoder.inverse_transform(top_k_indices)
        return list(top_k_themes)
    
    def _is_exact_match(self, input_title, existing_title, threshold=0.85):
        """
        Check if input title is an exact or near-exact match to an existing title.
        Uses both string similarity and semantic similarity.
        """
        # Normalize both titles
        input_clean = input_title.lower().strip('"').strip("'")
        existing_clean = existing_title.lower().strip('"').strip("'")
        
        # Exact string match
        if input_clean == existing_clean:
            return True, 1.0
        
        # Semantic similarity check via TF-IDF
        try:
            input_vec = self.title_tfidf.transform([input_title])
            existing_vec = self.title_tfidf.transform([existing_title])
            similarity = cosine_similarity(input_vec, existing_vec)[0][0]
            
            if similarity >= threshold:
                return True, float(similarity)
        except:
            pass
        
        return False, 0.0
    
    def _calculate_researcher_score(self, researcher, target_theme, target_keywords=None):
        """Calculate recommendation score for a researcher"""
        profile = self.researcher_profiles.get(researcher, {})
        
        breakdown = {}
        
        # Handle empty profile
        if not profile:
            breakdown['theme_matches'] = 0
            breakdown['theme_score'] = 0
            breakdown['keyword_score'] = 0
            breakdown['contribution_score'] = 0
            breakdown['recency_score'] = 0
            breakdown['total_score'] = 0
            return 0, breakdown
        
        score = 0
        
        # 1. Theme match (primary factor)
        theme_matches = profile['theme_counts'].get(target_theme, 0)
        theme_score = theme_matches * 10
        breakdown['theme_matches'] = theme_matches
        breakdown['theme_score'] = theme_score
        
        # 2. Keyword/title similarity with boost for closely related papers
        keyword_score = 0
        max_similarity = 0
        exact_match_found = False
        
        if target_keywords and profile['titles']:
            target_vec = self.title_tfidf.transform([target_keywords])
            similarities = []
            
            for title in profile['titles']:
                if title in self.title_to_idx:
                    title_idx = self.title_to_idx[title]
                    title_vec = self.title_vectors[title_idx]
                    sim = cosine_similarity(target_vec, title_vec)[0][0]
                    similarities.append((sim, title))
                    
                    # Check for exact/near-exact match
                    is_match, match_score = self._is_exact_match(target_keywords, title, threshold=0.85)
                    if is_match:
                        exact_match_found = True
                        max_similarity = max(max_similarity, match_score)
            
            if similarities:
                best_sim, best_title = max(similarities, key=lambda x: x[0])
                max_similarity = max(max_similarity, best_sim)
            
            # Calculate keyword score with significant boost for closely related papers
            # Base multiplier increased from 50 to 100, with additional boost for exact matches
            if exact_match_found:
                # Exact match: massive boost to ensure researcher ranks #1
                keyword_score = max_similarity * 200  # Very high multiplier for exact matches
            else:
                # Close match: high boost for papers with high similarity (>0.7)
                if max_similarity > 0.7:
                    keyword_score = max_similarity * 150  # High boost for closely related papers
                else:
                    # Regular similarity scoring
                    keyword_score = max_similarity * 100  # Increased base multiplier
        
        breakdown['keyword_score'] = keyword_score
        
        # 3. Contribution in theme-related projects
        contribution_score = 0
        theme_projects = [p for p in profile['projects'] if p['theme'] == target_theme]
        if theme_projects:
            avg_contribution = np.mean([p['contribution'] for p in theme_projects])
            contribution_score = (avg_contribution / 100) * 20
        
        breakdown['contribution_score'] = contribution_score
        
        # 4. Recency bonus
        recency_score = 0
        recent_projects = [p for p in profile['projects'] if p['year'] >= self.current_year - 3]
        if recent_projects:
            recency_score = len(recent_projects) * 5
        
        breakdown['recency_score'] = recency_score
        
        total_score = theme_score + keyword_score + contribution_score + recency_score
        breakdown['total_score'] = total_score
        
        return total_score, breakdown
    
    def recommend(self, project_title, target_theme=None, top_n=5):
        """
        Recommend researchers for a project.
        
        Args:
            project_title: Title of the new project
            target_theme: (Optional) Manually specified theme. If None, will be predicted.
            top_n: Number of researchers to recommend
            
        Returns:
            Dictionary with predicted theme and recommended researchers
        """
        # Predict theme if not provided
        if target_theme is None:
            predicted_themes = self._get_top_predicted_themes(project_title, k=2)
            target_theme = predicted_themes[0] if predicted_themes else "Unknown"
        
        # Score all researchers
        recommendations = []
        for researcher in self.researcher_profiles.keys():
            score, breakdown = self._calculate_researcher_score(researcher, target_theme, project_title)
            if score > 0:
                recommendations.append({
                    'researcher': researcher,
                    'score': score,
                    'breakdown': breakdown,
                    'projects': len(self.researcher_profiles[researcher]['projects']),
                    'theme_projects': breakdown['theme_matches']
                })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top N
        return {
            'project_title': project_title,
            'predicted_theme': target_theme,
            'recommendations': recommendations[:top_n],
            'total_researchers_scored': len(recommendations)
        }


def get_recommendations(project_title, target_theme=None, top_n=5):
    """
    Convenience function to get recommendations.
    
    Args:
        project_title: Title of the new project
        target_theme: (Optional) Manually specified theme
        top_n: Number of recommendations to return
        
    Returns:
        JSON-serializable dictionary with recommendations
    """
    engine = ResearcherRecommendationEngine()
    result = engine.recommend(project_title, target_theme, top_n)
    
    # Get the actual theme that was used for recommendations
    actual_theme = result.get('predicted_theme', target_theme)
    
    # Format for JSON serialization with detailed breakdown and related papers
    formatted_recommendations = []
    for rec in result['recommendations']:
        researcher = rec['researcher']
        
        # Find papers related to the target theme for this researcher
        related_papers = []
        for _, grant in engine.grants_df.iterrows():
            # Check if researcher is in the grant's researchers list
            researchers_in_grant = [r.strip().strip("'") for r in str(grant['Researchers']).split(',')]
            grant_theme = str(grant['Theme']).strip("'")
            
            if researcher in researchers_in_grant and grant_theme == actual_theme:
                paper_title = str(grant['Title']).strip('"')
                related_papers.append(paper_title)
        
        formatted_rec = {
            'researcher': researcher,
            'score': float(rec['score']),
            'theme_projects': int(rec['breakdown'].get('theme_matches', 0)),
            'total_projects': int(rec['projects']),
            'breakdown': {
                'theme_score': float(rec['breakdown'].get('theme_score', 0)),
                'keyword_score': float(rec['breakdown'].get('keyword_score', 0)),
                'contribution_score': float(rec['breakdown'].get('contribution_score', 0)),
                'recency_score': float(rec['breakdown'].get('recency_score', 0))
            },
            'related_papers': related_papers
        }
        formatted_recommendations.append(formatted_rec)
    
    result['recommendations'] = formatted_recommendations
    
    return result


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python recommend_researchers.py '<project_title>' [theme] [top_n]")
        sys.exit(1)
    
    project_title = sys.argv[1]
    target_theme = sys.argv[2] if len(sys.argv) > 2 else None
    top_n = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    
    result = get_recommendations(project_title, target_theme, top_n)
    print(json.dumps(result, indent=2))
