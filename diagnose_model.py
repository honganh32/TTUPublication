#!/usr/bin/env python3
"""Diagnose theme prediction model issues"""

import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Load the trained models
model_dir = 'model_artifacts'
with open(os.path.join(model_dir, 'logistic_model.pkl'), 'rb') as f:
    model = pickle.load(f)
with open(os.path.join(model_dir, 'tfidf_vectorizer.pkl'), 'rb') as f:
    tfidf = pickle.load(f)
with open(os.path.join(model_dir, 'label_encoder.pkl'), 'rb') as f:
    encoder = pickle.load(f)

# Load data to check distribution
df = pd.read_csv('grants_final.tsv', sep='\t')
df['Title'] = df['Title'].str.strip('"')
df['Theme'] = df['Theme'].str.strip("'")

# Check theme distribution
print("=== THEME DISTRIBUTION ===")
theme_counts = df['Theme'].value_counts()
for theme, count in theme_counts.items():
    print(f"{theme}: {count}")

print("\n=== CLASS IMBALANCE ANALYSIS ===")
print(f"Total samples: {len(df)}")
print(f"Number of themes: {len(theme_counts)}")
print(f"Dominant theme: {theme_counts.index[0]} ({theme_counts.iloc[0]} samples, {theme_counts.iloc[0]/len(df)*100:.1f}%)")

# Test predictions
test_inputs = [
    "Quantum Computing",
    "Quantum",
    "Quantum Physics",
    "Quantum Cryptography",
    "Deep Learning",
    "Machine Learning",
    "Healthcare",
    "Biomedical",
    "Cybersecurity",
    "Network Security",
    "Education",
    "STEM Learning",
]

print("\n=== THEME PREDICTIONS ===")
for test_input in test_inputs:
    X_vec = tfidf.transform([test_input])
    probs = model.predict_proba(X_vec)[0]
    top_3_idx = np.argsort(probs)[::-1][:3]
    
    print(f"\nInput: '{test_input}'")
    for i, idx in enumerate(top_3_idx, 1):
        theme = encoder.inverse_transform([idx])[0]
        prob = probs[idx]
        print(f"  {i}. {theme}: {prob:.3f}")

# Check model coefficients to see what features are important for each theme
print("\n=== FEATURE IMPORTANCE FOR EACH THEME ===")
feature_names = tfidf.get_feature_names_out()

for idx, theme in enumerate(encoder.classes_):
    # Get top features pushing towards this class
    coef = model.coef_[idx]
    top_feature_idx = np.argsort(coef)[::-1][:5]
    top_features = [feature_names[i] for i in top_feature_idx]
    print(f"\n{theme}:")
    print(f"  Top features: {', '.join(top_features)}")
