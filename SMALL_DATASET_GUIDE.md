# Improving Machine Learning Models with Limited Training Data

## Your Current Situation
- **Dataset size:** 48 samples
- **Number of classes:** 10 themes
- **Avg samples/class:** 4.8
- **Problem:** Very limited data for training

## Comprehensive Strategies (Ranked by Impact)

### 🎯 1. COLLECT MORE DATA (HIGHEST IMPACT - Do This First!)

**Target:** 20-50 samples per class minimum (10x more samples)

```
Current: 48 total samples (4.8 avg per class)
Goal:    200-500 samples (20-50 per class)
Impact:  Can improve accuracy by 20-40%
```

**How to collect:**
- Survey researchers about their work themes
- Extract theses/dissertations from university databases
- Mine research repositories and publications
- Combine with public datasets in your domain

---

### 2. CROSS-VALIDATION (ALREADY IMPLEMENTED ✓)

**What it does:** Uses all data for both training and testing

```python
from sklearn.model_selection import StratifiedKFold, cross_validate

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(model, X, y, cv=skf, 
                           scoring=['accuracy', 'f1_weighted'])
```

**Benefits:**
- ✓ Better performance estimates with limited data
- ✓ Detects overfitting early
- ✓ Uses all data efficiently
- ✓ Reduces variance in performance metrics

**Your results:**
- Cross-validation accuracy: 45.78% (±9.72%)
- Training accuracy: 95.83%
- **Gap indicates overfitting** - more data needed

---

### 3. HYPERPARAMETER OPTIMIZATION (ALREADY IMPLEMENTED ✓)

**Techniques applied:**

| Parameter | Value | Why |
|-----------|-------|-----|
| `class_weight='balanced'` | Balanced | Handle class imbalance |
| `C` | 0.1 | Stronger regularization prevents overfitting |
| `max_features` | 1000 | Reduced from 5000 to avoid overfitting |
| `min_df` | 1 | Include rare but important terms |
| `max_df` | 0.8 | Exclude common stopwords |

**Impact:** Can improve performance by 5-15%

---

### 4. ENSEMBLE METHODS (IMPLEMENTED - OPTIONAL)

**What it does:** Combine multiple weak models into one stronger model

```python
from sklearn.ensemble import VotingClassifier, BaggingClassifier

# Voting Classifier
ensemble = VotingClassifier(
    estimators=[
        ('logistic_l2', LogisticRegression(C=0.1)),
        ('naive_bayes', MultinomialNB()),
        ('logistic_saga', LogisticRegression(C=1.0))
    ],
    voting='soft'
)

# Bagging
bagging = BaggingClassifier(
    estimator=LogisticRegression(C=0.1),
    n_estimators=10
)
```

**Benefits:**
- ✓ Reduces variance (important for small data)
- ✓ Combines different model perspectives
- ✓ More robust predictions

**Your results:**
- Single model: 95.83%
- Ensemble: 93.75%
- Bagging: 95.83%
- **Note:** Diminishing returns on very small datasets

---

### 5. DATA AUGMENTATION (EASY WINS)

**Technique:** Create synthetic variations of existing data

```python
def augment_data(titles, labels, augmentation_factor=2):
    """Multiply dataset without new collection"""
    augmented_titles = []
    augmented_labels = []
    
    for title, label in zip(titles, labels):
        augmented_titles.append(title)
        augmented_labels.append(label)
        
        # Variation 1: Add common synonyms
        augmented_titles.append(title + " and Applications")
        augmented_labels.append(label)
        
        # Variation 2: Paraphrase
        augmented_titles.append(f"{title} Research")
        augmented_labels.append(label)
    
    return augmented_titles, augmented_labels
```

**Examples:**
- "Quantum" → "Quantum Computing", "Quantum Physics", "Quantum Applications"
- "Deep Learning" → "Deep Learning and Neural Networks", "Deep Learning Methods"

**Impact:** Can 2-3x your dataset without new collection
**Time:** Easy to implement (1-2 hours)

---

### 6. FEATURE ENGINEERING

**Add domain-specific features:**

```python
import pandas as pd

def engineer_features(titles_df):
    """Add meaningful features from titles"""
    features = pd.DataFrame()
    
    # 1. Specific keyword presence
    features['has_quantum'] = titles_df['Title'].str.contains('Quantum', case=False)
    features['has_ai'] = titles_df['Title'].str.contains('AI|Machine Learning', case=False)
    features['has_healthcare'] = titles_df['Title'].str.contains('Health|Medical|Bio', case=False)
    
    # 2. Title statistics
    features['title_length'] = titles_df['Title'].str.len()
    features['word_count'] = titles_df['Title'].str.split().str.len()
    
    # 3. Specific term frequencies
    features['learning_freq'] = titles_df['Title'].str.contains('learning', case=False).astype(int)
    
    return features

# Combine with TF-IDF features
X_combined = pd.concat([tfidf_features, engineer_features(df)], axis=1)
```

**Impact:** Can improve by 10-20%
**Time:** 2-4 hours

---

### 7. TRANSFER LEARNING (ADVANCED)

**Use pre-trained models to leverage external knowledge:**

```python
# Option 1: Use pre-trained embeddings (FastText, Word2Vec)
from gensim.models import Word2Vec

# Train on your data
w2v = Word2Vec(sentences=title_words, vector_size=100, workers=4)

# Option 2: Use transformer embeddings (BERT, etc.)
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(titles)
X = embeddings  # Use instead of TF-IDF
```

**Benefits:**
- ✓ Leverages millions of parameters trained on external data
- ✓ Works well with small datasets
- ✓ Can improve by 20-40%

**Trade-off:** Requires more computational resources

---

### 8. STRATIFIED SAMPLING & BOOTSTRAP

**For very small classes:**

```python
from sklearn.utils import resample

# Oversample minority classes
df_majority = df[df['Theme'] == 'Education & Workforce Development']
df_minority = df[df['Theme'] == 'Quantum']

# Upsample minority to match majority
df_minority_upsampled = resample(df_minority, 
                                 n_samples=len(df_majority),
                                 replace=True,  # With replacement
                                 random_state=42)

df_balanced = pd.concat([df_majority, df_minority_upsampled])
```

**Impact:** Helps with extreme class imbalance

---

## Priority Action Plan

### Week 1: Quick Wins
- [ ] Implement data augmentation (2-3x dataset)
  - Time: 2 hours
  - Impact: +10-15% accuracy
  - Effort: Low

- [ ] Add keyword-based features
  - Time: 2-3 hours
  - Impact: +5-10% accuracy
  - Effort: Low-Medium

### Week 2: Medium Efforts
- [ ] Collect 50+ new samples (focus on underrepresented classes)
  - Time: 4-8 hours
  - Impact: +20-30% accuracy
  - Effort: High

- [ ] Implement transfer learning with embeddings
  - Time: 4-6 hours
  - Impact: +10-20% accuracy
  - Effort: Medium

### Week 3: Long-term Improvements
- [ ] Continue data collection (target 20+ per class)
  - Time: Ongoing
  - Impact: +20-40% accuracy
  - Effort: High but essential

- [ ] Fine-tune with domain expert feedback
  - Time: 2-3 hours
  - Impact: +5-10% accuracy
  - Effort: Low

---

## Troubleshooting: Your Current Issues

### Issue: Cross-validation accuracy (45.78%) << Training accuracy (95.83%)

**Diagnosis:** Severe overfitting due to small dataset

**Solutions (in order):**
1. **Reduce model complexity** (more important than more data initially)
   ```python
   # More aggressive regularization
   LogisticRegression(C=0.01)  # Stronger L2 penalty
   max_features=100  # Even fewer features
   ```

2. **Stop words adjustment**
   ```python
   TfidfVectorizer(stop_words='english', max_df=0.9, min_df=2)
   ```

3. **Increase training data** (fundamental fix)
   - Most impactful solution

---

## Code Template: Putting It All Together

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_validate, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np

# 1. Load & augment data
df = pd.read_csv('grants_final.tsv', sep='\t')
# TODO: Add augmentation here

# 2. Feature engineering
tfidf = TfidfVectorizer(
    max_features=500,  # Conservative
    max_df=0.8,
    min_df=1,
    stop_words='english'
)
X_tfidf = tfidf.fit_transform(df['Title'])

# 3. Add domain features
X_combined = add_domain_features(df['Title'], X_tfidf)

# 4. Cross-validation
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df['Theme'])

model = LogisticRegression(
    C=0.1,
    class_weight='balanced',
    max_iter=2000,
    solver='lbfgs'
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_validate(model, X_combined, y, cv=cv, 
                       scoring=['accuracy', 'f1_weighted'])

print(f"CV Accuracy: {scores['test_accuracy'].mean():.2%}")

# 5. Train final model
model.fit(X_combined, y)
```

---

## Summary

| Strategy | Time | Impact | Priority |
|----------|------|--------|----------|
| **Collect More Data** | High | Very High | ★★★★★ |
| **Data Augmentation** | Low | Medium | ★★★★ |
| **Cross-Validation** | Low | Medium | ★★★★ |
| **Hyperparameter Tuning** | Medium | Low-Medium | ★★★ |
| **Feature Engineering** | Medium | Medium | ★★★ |
| **Ensemble Methods** | Low | Low | ★★ |
| **Transfer Learning** | High | High | ★★★ |
| **Bootstrap Sampling** | Low | Low | ★★ |

## Resources

- **Scikit-learn documentation:** https://scikit-learn.org (small datasets guide)
- **Imbalanced-learn library:** https://imbalanced-learn.org/ (for class imbalance)
- **Sentence Transformers:** https://www.sbert.net/ (transfer learning)
