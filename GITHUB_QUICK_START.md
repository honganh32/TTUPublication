# Quick GitHub Setup Guide for TTUPublication

**Complete these 6 steps to publish your project on GitHub:**

## Step 1: Create GitHub Repository
- Go to https://github.com/new
- Repository name: `TTUPublication`
- Description: "Researcher recommendation system for TimeArcs visualization"
- Visibility: Public (recommended) or Private
- Click "Create repository"

## Step 2: Configure Git Locally

```bash
# Navigate to TTUPublication folder
cd e:\TimeArcs-master\TimeArcs-master\TTUPublication

# Initialize repository
git init

# Configure user (one-time)
git config --global user.name "Your Full Name"
git config --global user.email "your.email@github.com"

# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/TTUPublication.git

# Verify remote
git remote -v
```

## Step 3: Create Initial Commit

```bash
# Stage all files (respects .gitignore)
git add .

# Verify what will be committed
git status

# Commit
git commit -m "Initial commit: TTUPublication researcher recommendation system"
```

## Step 4: Push to GitHub

```bash
# Push to GitHub
git push -u origin main

# If error "branch 'main' does not exist", try:
git push -u origin master

# Verify on GitHub:
# - Go to https://github.com/YOUR-USERNAME/TTUPublication
# - Check files are uploaded
```

## Step 5: (Optional) Create Personal Access Token

If pushing fails with authentication:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`, `user`, `admin:org_hook`
4. Copy token and save securely
5. Use token as password instead of GitHub password

## Step 6: Share & Collaborate

```bash
# Every time you make changes:
git add .
git commit -m "Describe your changes"
git push origin main

# To create feature branch for new features:
git checkout -b feature/your-feature-name
# ... make changes ...
git push -u origin feature/your-feature-name
# Then create Pull Request on GitHub
```

---

## Files Ready for GitHub

✅ README.md - Project overview and features  
✅ .gitignore - File exclusions  
✅ requirements.txt - Python dependencies  
✅ CONTRIBUTING.md - Contribution guidelines  
✅ GITHUB_SETUP.md - Detailed setup guide  
✅ recommend_researchers.py - Core recommendation engine  
✅ train_model.ipynb - Model training notebook  
✅ server.py - HTTP server  
✅ index.html - Web interface  

---

## Common Commands

```bash
# Check status
git status

# View differences
git diff

# View history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard changes to file
git checkout -- filename.txt

# Create branch
git checkout -b feature/name

# Switch branch
git checkout feature/name

# Merge branch
git merge feature/name

# Pull latest changes
git pull origin main
```

---

## Troubleshooting

**Error: "fatal: 'origin' does not appear to be a 'git' repository"**
```bash
git remote add origin https://github.com/YOUR-USERNAME/TTUPublication.git
```

**Error: "Permission denied (publickey)"**
- Use HTTPS instead of SSH
- Or generate SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

**Error: "Updates were rejected"**
```bash
git pull origin main
git push origin main
```

---

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code
3. → Share link with collaborators
4. → Create Issues for improvements
5. → Accept Pull Requests from contributors

---

**Full guide available in GITHUB_SETUP.md**
