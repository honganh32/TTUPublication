# Setting Up GitHub Repository for TTUPublication

This guide walks you through creating and managing a GitHub repository for the TTUPublication project.

## Prerequisites

### 1. Install Git
- **Windows**: Download from https://git-scm.com/download/win
- **Mac**: `brew install git`
- **Linux**: `apt-get install git`

Verify installation:
```bash
git --version
```

### 2. Create GitHub Account
- Go to https://github.com/join
- Create free account
- Verify email address

### 3. Configure Git
```bash
# Set your name and email (use GitHub account email)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

---

## Step-by-Step Setup

### Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name**: `TTUPublication` (or your preferred name)
   - **Description**: "Researcher recommendation system for TimeArcs visualization platform"
   - **Visibility**: Choose "Public" or "Private"
   - **Initialize with**: ✅ Add .gitignore (Python) - **Optional, we created our own**
   - **License**: MIT (recommended)

3. Click "Create repository"
4. Copy the repository URL (HTTPS or SSH)

**Example URL:**
```
https://github.com/your-username/TTUPublication.git
```

---

### Step 2: Initialize Local Repository

```bash
# Navigate to your TTUPublication folder
cd e:\TimeArcs-master\TimeArcs-master\TTUPublication

# Initialize git repository
git init

# Add GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/TTUPublication.git

# Verify remote
git remote -v
```

**Output should show:**
```
origin  https://github.com/YOUR-USERNAME/TTUPublication.git (fetch)
origin  https://github.com/YOUR-USERNAME/TTUPublication.git (push)
```

---

### Step 3: Configure Git Ignore

We already created `.gitignore`. Verify it includes important exclusions:

```bash
# Check .gitignore exists
type .gitignore  # Windows
cat .gitignore   # Mac/Linux

# Update if needed - avoid committing:
# - __pycache__/
# - *.pyc
# - .ipynb_checkpoints/
# - model_artifacts/ (if > 10MB)
# - venv/ (if local virtual env)
```

---

### Step 4: Create/Update README and Documentation

We've created:
- ✅ `README.md` - Project overview
- ✅ `.gitignore` - File exclusions
- ✅ `SMALL_DATASET_GUIDE.md` - Training guide
- ✅ `MODEL_IMPROVEMENTS.md` - Recent improvements

Add optional files:

**LICENSE.md** (MIT License):
```bash
# Copy MIT license content
curl https://opensource.org/licenses/MIT > LICENSE.txt
```

**CONTRIBUTING.md**:
```markdown
# Contributing to TTUPublication

## How to Contribute
1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## Code Style
- Follow PEP 8 Python style guide
- Add docstrings to functions
- Test before submitting PR
```

---

### Step 5: Stage and Commit Files

```bash
# Check status
git status

# Stage all files
git add .

# Or stage specific files
git add README.md
git add .gitignore
git add recommend_researchers.py
git add train_model.ipynb
git add server.py
git add index.html

# View staged changes
git diff --cached

# Commit with message
git commit -m "Initial commit: TTUPublication researcher recommendation system"

# View commit history
git log --oneline
```

---

### Step 6: Push to GitHub

```bash
# Push to GitHub
git push -u origin main

# Or if your default branch is 'master'
git push -u origin master

# Verify push
git remote -v
```

**Note**: First push may prompt for GitHub credentials. Use:
- **Username**: Your GitHub username
- **Password**: GitHub Personal Access Token (not your password)

#### Creating GitHub Personal Access Token (Recommended)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo`, `workflow`, `user`
4. Copy token and save securely
5. Use token as password when pushing

---

## Common Git Workflows

### Adding New Files

```bash
# Make changes to files
# ... edit recommend_researchers.py, etc ...

# View changes
git status
git diff recommend_researchers.py

# Stage changes
git add recommend_researchers.py

# Commit
git commit -m "Improve recommendation scoring algorithm"

# Push
git push origin main
```

### Creating Feature Branches

```bash
# Create and switch to new branch
git checkout -b feature/data-augmentation

# Make changes and commit
git add .
git commit -m "Add data augmentation to training pipeline"

# Push branch
git push -u origin feature/data-augmentation

# On GitHub, create Pull Request -> Merge when reviewed
```

### Syncing with Remote

```bash
# View branches
git branch -a

# Pull latest changes
git pull origin main

# Fetch without merging
git fetch origin

# View potential conflicts
git diff
```

---

## File Organization (for GitHub)

**Recommended project structure:**

```
TTUPublication/
├── README.md                              # Project overview
├── LICENSE.txt                            # MIT License
├── CONTRIBUTING.md                        # Contribution guidelines
├── .gitignore                             # Git ignore rules
├── requirements.txt                       # Python dependencies
│
├── src/                                   # Source code
│   ├── server.py                         # HTTP server
│   ├── recommend_researchers.py          # Recommendation engine
│   └── __init__.py
│
├── notebooks/                            # Jupyter notebooks
│   ├── train_model.ipynb                # Model training
│   └── Research_theme_assignment.ipynb  # Theme assignment
│
├── data/                                 # Data files
│   ├── grants_final.tsv                 # Training data
│   └── README.md                        # Data description
│
├── models/                               # Trained models
│   └── model_artifacts/                 # Pickled models
│       ├── logistic_model.pkl
│       ├── tfidf_vectorizer.pkl
│       └── label_encoder.pkl
│
├── web/                                  # Web interface
│   ├── index.html                       # Main UI
│   ├── styles/                          # CSS
│   └── pubJavascripts/                  # JavaScript
│
├── docs/                                 # Documentation
│   ├── SMALL_DATASET_GUIDE.md
│   ├── MODEL_IMPROVEMENTS.md
│   └── SERVER_SETUP.md
│
└── tests/                                # Test files
    ├── test_recommendations.py
    └── test_models.py
```

### Implement Structure:

```bash
# Create directories
mkdir src notebooks data models/model_artifacts web/styles web/pubJavascripts docs tests

# Move files
move recommend_researchers.py src/
move server.py src/
move train_model.ipynb notebooks/
move grants_final.tsv data/
move model_artifacts/*.pkl models/model_artifacts/
move index.html web/
move SMALL_DATASET_GUIDE.md docs/
move MODEL_IMPROVEMENTS.md docs/

# Commit restructure
git add .
git commit -m "Reorganize project structure for better maintainability"
git push origin main
```

---

## Create requirements.txt

```bash
# Generate requirements from installed packages
pip freeze > requirements.txt

# Or manually create (recommended - cleaner):
```

Create `requirements.txt`:
```
pandas>=2.0.0
numpy>=1.20.0
scikit-learn>=1.0.0
matplotlib>=3.0.0
```

```bash
# Commit
git add requirements.txt
git commit -m "Add Python dependencies file"
git push origin main
```

---

## Adding to Existing Repository

If TimeArcs already has a repository:

```bash
# Go to TTUPublication folder
cd TTUPublication

# Initialize as subfolder
git init

# Create separate repo OR
# Add as git submodule to parent:
git submodule add https://github.com/yourusername/TTUPublication.git TTUPublication
```

---

## Useful GitHub Features

### 1. Add Documentation (Wiki)

```bash
# Clone wiki
git clone https://github.com/yourusername/TTUPublication.wiki.git

# Add pages
# TTUPublication.wiki/
# ├── Home.md
# ├── Installation.md
# ├── API-Documentation.md
# └── Troubleshooting.md
```

### 2. Create Issues

- Go to Issues tab on GitHub
- Create issue for tasks/bugs
- Link to commits/PRs

### 3. Add CI/CD Pipeline

Create `.github/workflows/test.yml`:
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          python -m pytest tests/
```

### 4. Add Releases

```bash
# Create git tag
git tag -a v1.0.0 -m "Initial release"

# Push tags
git push origin v1.0.0

# On GitHub: Releases tab -> Create release from tag
```

---

## Best Practices

### Commit Messages
```bash
# Good
git commit -m "Add keyword similarity boosting to recommendation scoring"
git commit -m "Fix overfitting in theme prediction model"

# Bad
git commit -m "update"
git commit -m "fix stuff"
```

### Branching Strategy
```bash
# Use descriptive branch names
git checkout -b fix/quantum-theme-prediction
git checkout -b feature/data-augmentation
git checkout -b docs/update-readme
```

### Keep Repository clean
```bash
# Delete local branches
git branch -d feature/done
git branch -D feature/abandoned

# Delete remote branches
git push origin --delete feature/done
```

### Regular Updates
```bash
# Pull latest before working
git pull origin main

# Push frequently (at least daily)
git push origin feature-branch
```

---

## Troubleshooting

### Issue: Authentication Failed

```bash
# Generate Personal Access Token on GitHub:
# Settings > Developer settings > Personal access tokens
# Use token instead of password

# Cache token
git config --global credential.helper wincred  # Windows
git config --global credential.helper osxkeychain  # Mac
```

### Issue: Committed Wrong Files

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Remove file from staging
git reset HEAD filename.txt

# Undo last commit and changes
git reset --hard HEAD~1
```

### Issue: Merge Conflicts

```bash
# View conflicts
git status

# Edit conflicted files manually
# Then:
git add resolved_file.txt
git commit -m "Resolve merge conflict"
git push origin main
```

---

## GitHub Pages (Optional - Host Docs)

Create `docs/index.html` in repository:

1. Go to Settings > Pages
2. Select "Deploy from branch"
3. Branch: main, folder: /docs
4. Save

Your documentation will be available at:
```
https://yourusername.github.io/TTUPublication/
```

---

## Quick Reference

```bash
# Clone existing repo
git clone https://github.com/yourusername/TTUPublication.git

# Check status
git status

# View differences
git diff

# View history
git log --oneline

# Create branch
git branch -b feature/name

# Switch branch
git checkout feature/name

# Merge branch
git merge feature/name

# Delete branch
git branch -d feature/name

# Stage changes
git add .

# Commit
git commit -m "message"

# Push
git push origin branch-name

# Pull
git pull origin main

# Tag release
git tag -a v1.0 -m "Release v1.0"

# Push tags
git push origin v1.0
```

---

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Configure git locally
3. ✅ Create initial commit
4. ✅ Push to GitHub
5. **→** Share repository link with collaborators
6. **→** Set up branch protection rules (optional)
7. **→** Enable required status checks (optional)
8. **→** Create issue templates (optional)

---

## Questions?

- GitHub Docs: https://docs.github.com
- Git Tutorial: https://git-scm.com/book/en/v2
- GitHub CLI: https://cli.github.com/
