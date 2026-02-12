# Contributing to TTUPublication

Thank you for your interest in contributing to the TTUPublication researcher recommendation system! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report inappropriate behavior to maintainers

## Getting Started

### 1. Fork the Repository

```bash
# On GitHub, click "Fork" button
# Clone your fork
git clone https://github.com/YOUR-USERNAME/TTUPublication.git
cd TTUPublication
```

### 2. Create Development Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Create Feature Branch

```bash
# Create descriptive branch name
git checkout -b feature/your-feature-name
# or bug/fix-description
# or docs/update-readme
```

## Development Workflow

### Testing Your Changes

```bash
# Test recommendation engine
python -c "from recommend_researchers import ResearcherRecommendationEngine; engine = ResearcherRecommendationEngine()"

# Test model training
jupyter notebook notebooks/train_model.ipynb

# Test server
python server.py
# Visit http://localhost:8000
```

### Making Changes

1. **Code Style**: Follow PEP 8
   ```bash
   pip install flake8
   flake8 recommend_researchers.py server.py
   ```

2. **Add Documentation**:
   - Docstrings for all functions
   - Comments for complex logic
   - Update README if adding features

3. **Commit Often**:
   ```bash
   git add docs/updates.md
   git commit -m "Update documentation for new feature"
   ```

### Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# On GitHub:
# 1. Go to your fork
# 2. Click "New Pull Request"
# 3. Select base: main, compare: your-branch
# 4. Fill in PR description
# 5. Click "Create Pull Request"
```

## Pull Request Guidelines

### PR Description Should Include:

- **What**: What does this PR do?
- **Why**: Why is this change needed?
- **How**: How does the solution work?
- **Testing**: How was this tested?

**Example PR Description**:
```markdown
## What
Improves researcher ranking by implementing 3-tier keyword scoring

## Why
Current scoring treats exact matches same as partial matches, 
so papers with identical titles don't boost researchers to top

## How
- Added _is_exact_match() function for title comparison
- Implemented 3-tier multiplier: exact (×200), close (×150), regular (×100)
- Papers with >0.85 similarity now guarantees top ranking

## Testing
Tested with "AI Across the Curriculum for Virtual Schools"
- Victor Sheng (exact author): Score=327.96 (Keyword=200.00) ✓
- Yuanlin Zhang (exact author): Score=323.50 ✓
```

### PR Checklist:

- [ ] Code follows PEP 8 style
- [ ] Added/updated comments and docstrings
- [ ] Updated README if needed
- [ ] Tested changes locally
- [ ] Commit messages are clear and descriptive
- [ ] No unrelated changes included

## Types of Contributions

### Bug Fixes

```bash
# Branch name: bug/issue-description
git checkout -b bug/theme-prediction-quantum

# What we need:
# 1. Description of bug
# 2. Steps to reproduce
# 3. Expected vs actual behavior
# 4. Error messages/logs
```

### Feature Requests

```bash
# Branch name: feature/feature-name
git checkout -b feature/data-augmentation

# What we need:
# 1. Clear problem description
# 2. Proposed solution
# 3. Benefits
# 4. Example usage
```

### Documentation Updates

```bash
# Branch name: docs/description
git checkout -b docs/add-api-examples

# What we need:
# 1. Why documentation needs update
# 2. What information is missing
# 3. Proposed content
```

### Performance Improvements

```bash
# Branch name: perf/improvement-name
git checkout -b perf/vectorizer-caching

# What we need:
# 1. Current performance metrics
# 2. Proposed solution
# 3. New performance metrics
# 4. Impact on accuracy/quality
```

## Areas for Contribution

### High Priority
- [ ] Collect more training data (currently 48 samples)
- [ ] Improve cross-validation accuracy (currently 45.78%)
- [ ] Add unit tests for recommendation engine
- [ ] Create data augmentation pipeline
- [ ] Implement transfer learning models

### Medium Priority
- [ ] Add researcher profile visualization
- [ ] Create export functionality (CSV, JSON)
- [ ] Add filtering options (year, department)
- [ ] Improve UI responsiveness
- [ ] Add keyboard shortcuts

### Low Priority
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Advanced analytics dashboard

## Development Guidelines

### Python Code

```python
# Good: Clear, documented, follows PEP 8
def calculate_similarity_score(text1: str, text2: str) -> float:
    """
    Calculate cosine similarity between two text strings.
    
    Args:
        text1: First text string
        text2: Second text string
    
    Returns:
        Similarity score between 0 and 1
    """
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    return cosine_similarity(vectors[0], vectors[1])[0][0]

# Bad: No docstring, unclear variable names
def calc_sim(t1, t2):
    v = TfidfVectorizer()
    vecs = v.fit_transform([t1, t2])
    return cosine_similarity(vecs[0], vecs[1])[0][0]
```

### Function Docstrings

```python
def recommend_researchers(theme: str, num_engineers: int = 5) -> dict:
    """
    Get top researchers for a given research theme.
    
    Args:
        theme: Research theme (e.g., "Machine Learning", "Quantum Computing")
        num_engineers: Number of recommendations to return
    
    Returns:
        Dictionary with keys:
            - 'researchers': List of recommended researcher dicts
            - 'total_found': Total researchers in theme
            - 'processing_time': Time taken in milliseconds
    
    Raises:
        ValueError: If theme not found in training data
        FileNotFoundError: If model artifacts missing
    
    Example:
        >>> results = recommend_researchers("Machine Learning", num_engineers=3)
        >>> results['researchers'][0]['name']
        'John Doe'
    """
    pass
```

### Comments

```python
# Good: Explains WHY, not WHAT
# Use balanced class weights because data has severe class imbalance
# (Education=24.2%, Quantum=2.1%), which causes model to default to dominant class
model = LogisticRegression(class_weight='balanced', C=0.1)

# Bad: Just repeats the code
# Set class weights to balanced
model = LogisticRegression(class_weight='balanced', C=0.1)
```

## Testing

### Create Tests

```python
# tests/test_recommendations.py
import unittest
from recommend_researchers import ResearcherRecommendationEngine

class TestRecommendations(unittest.TestCase):
    
    def setUp(self):
        """Initialize engine before each test"""
        self.engine = ResearcherRecommendationEngine()
    
    def test_quantum_theme_prediction(self):
        """Test that 'Quantum' input predicts correct theme"""
        results = self.engine.get_recommendations("Quantum Computing", "Quantum")
        self.assertEqual(results['theme'], "Quantum")
    
    def test_exact_match_boosting(self):
        """Test that exact paper matches boost researcher to top"""
        results = self.engine.get_recommendations(
            "AI Across the Curriculum for Virtual Schools"
        )
        self.assertEqual(results['researchers'][0]['name'], "Victor Sheng")

if __name__ == '__main__':
    unittest.main()
```

### Run Tests

```bash
# Install testing tools
pip install pytest pytest-cov

# Run all tests
pytest tests/

# Run with coverage
pytest --cov=. tests/
```

## Performance Considerations

### Current Metrics

- **Training data**: 48 samples, 10 themes
- **Cross-validation accuracy**: 45.78% ± 9.72%
- **Recommendation latency**: <100ms
- **Model size**: <1MB (pickled artifacts)

### Before Submitting PR with Performance Changes

1. Benchmark current performance
   ```bash
   python -m cProfile -s cumtime server.py
   ```

2. Make changes

3. Benchmark again and compare

4. Include metrics in PR description

## Model Improvements

### Training Data Collection

We need more data! Currently only 48 samples with 10 themes.

**Target**: 500+ samples with 15-20 themes

**How to contribute**:
1. Identify underrepresented themes
2. Research additional projects in those themes
3. Add to `data/grants_final.tsv` with columns: Code, Year, Theme, Title, Authors
4. Submit PR with data

### Model Experimentation

Current model: LogisticRegression with class_weight='balanced'

**Ideas to test**:
- SVM with RBF kernel
- Random Forest with balanced class weights
- Neural networks (transformer-based)
- Ensemble methods (stacking, boosting)
- Domain-specific embeddings (research-specific word2vec)

**How to contribute**:
1. Add experiments to separate cells in train_model.ipynb
2. Document methodology and results
3. Compare to baseline
4. Submit PR with findings

## Release Process

Only maintainers create releases, but here's the process:

```bash
# Update version
nano setup.py  # Change version number

# Tag release
git tag -a v1.1.0 -m "Add data augmentation and improve accuracy"

# Push tag
git push origin v1.1.0

# GitHub: Create release from tag with notes
```

## Questions?

- **For bugs**: Create GitHub Issue with reproduction steps
- **For features**: Create GitHub Discussion or Issue with proposal
- **For questions**: Email maintainers or post in Discussions
- **For urgent issues**: Contact maintainers directly

## License

By contributing to this project, you agree that your contributions will be licensed under the project's existing license (typically MIT).

## Acknowledgments

Thank you for contributing to making TTUPublication better! Contributors will be listed in:
- README.md Contributors section
- GitHub Contributors graph
- Release notes

---

**Happy Contributing!** 🎉

If you have questions, please don't hesitate to open an issue or reach out to the maintainers.
