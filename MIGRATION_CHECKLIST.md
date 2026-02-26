# GitHub Pages Migration Checklist

Use this checklist to migrate your TTUPublication project from local Python server to GitHub Pages.

## Pre-Migration

- [ ] Repository exists on GitHub
- [ ] All changes are committed locally
- [ ] You have Python and required packages installed locally

## Step 1: Convert Models to ONNX

- [ ] Install conversion dependencies:
  ```bash
  pip install skl2onnx onnx onnxruntime
  ```

- [ ] Run conversion script:
  ```bash
  python convert_models_to_onnx.py
  ```

- [ ] Verify ONNX files were created:
  - [ ] `model_artifacts/tfidf_vectorizer.onnx` exists
  - [ ] `model_artifacts/logistic_model.onnx` exists
  - [ ] `model_artifacts/label_encoder.json` exists

## Step 2: Review Changes

- [ ] Review updated `index.html` (client-side recommendations)
- [ ] Review updated `recommendation-engine.js` (ONNX support)
- [ ] Review `.gitignore` (ONNX files not excluded)
- [ ] Review `.github/workflows/deploy.yml` (auto-deployment)

## Step 3: Commit and Push

- [ ] Stage ONNX files:
  ```bash
  git add model_artifacts/*.onnx
  git add model_artifacts/label_encoder.json
  ```

- [ ] Stage modified files:
  ```bash
  git add index.html
  git add pubJavascripts/myscripts/recommendation-engine.js
  git add .github/workflows/deploy.yml
  git add .gitignore
  git add README.md
  git add GITHUB_PAGES_DEPLOYMENT.md
  ```

- [ ] Commit changes:
  ```bash
  git commit -m "Migrate to GitHub Pages with ONNX models"
  ```

- [ ] Push to GitHub:
  ```bash
  git push origin main
  ```

## Step 4: Configure GitHub Pages

- [ ] Go to your GitHub repository
- [ ] Click **Settings** tab
- [ ] Click **Pages** in left sidebar
- [ ] Under **Source**, select **GitHub Actions**
- [ ] Wait for the Actions workflow to complete

## Step 5: Test Deployment

- [ ] Access your site: `https://YOUR_USERNAME.github.io/TTUPublication/index.html`
- [ ] Test visualization loads correctly
- [ ] Test AI Recommendation mode:
  - [ ] Enter a project title (e.g., "Machine Learning Research")
  - [ ] Click "Get Recommendations"
  - [ ] Verify recommendations appear
  - [ ] Click "View" to see score breakdown
- [ ] Test Manual Entry mode (note: only updates local view)
- [ ] Check browser console for errors (F12)

## Step 6: Verify Model Loading

Open browser DevTools (F12) and check Console:

- [ ] See: "Initializing recommendation engine..."
- [ ] See: "✓ Recommendation engine ready"
- [ ] See: "Available themes: [...]"
- [ ] No 404 errors for ONNX files

## Troubleshooting

### Models Not Loading
```bash
# Check files are in repository
git ls-files model_artifacts/

# Should show:
# model_artifacts/label_encoder.json
# model_artifacts/logistic_model.onnx
# model_artifacts/tfidf_vectorizer.onnx
```

### GitHub Actions Failed
- Check Actions tab in GitHub
- Review build logs for errors
- Ensure all required files are committed

### 404 Errors
- Verify file paths are relative (no leading `/`)
- Check `grants_final.tsv` is in root directory
- Clear browser cache and retry

## Post-Migration

- [ ] Update project documentation
- [ ] Share new GitHub Pages URL with team
- [ ] Delete local server files (optional):
  - `server.py`
  - `recommend_researchers.py`
  - Python `.pkl` files (keep for retraining)
- [ ] Set up custom domain (optional)

## Rollback Plan

If you need to revert:

1. Restore `index.html` from git history
2. Re-enable local server mode
3. Use `git revert` to undo commits

## Support Resources

- 📖 [Full Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)
- 📖 [README.md](README.md)
- 🐛 [GitHub Issues](https://github.com/yourusername/TTUPublication/issues)

---

**Status:** ⏳ In Progress | ✅ Complete | ❌ Blocked

**Current Phase:** _________________

**Notes:** _________________

