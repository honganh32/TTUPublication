#!/usr/bin/env python3
"""
GitHub Pages Compatibility Helper Script

This script helps migrate from the local Python server to GitHub Pages deployment.
Run this before deploying to ensure JSON data is up to date.
"""

import sys
import json
from pathlib import Path
from tsv_to_json import tsv_to_json

print("=" * 60)
print("GitHub Pages Migration Helper")
print("=" * 60)

# Step 1: Convert TSV to JSON
print("\n1. Converting grants_final.tsv to JSON...")
if tsv_to_json('grants_final.tsv', 'data/grants_final.json'):
    print("   ✓ Data conversion successful")
else:
    print("   ✗ Data conversion failed")
    sys.exit(1)

# Step 2: Verify data directory exists
print("\n2. Checking data directory...")
data_dir = Path('data')
data_dir.mkdir(parents=True, exist_ok=True)
print(f"   ✓ Data directory ready at: {data_dir.absolute()}")

# Step 3: Check if .gitignore exists and update it
print("\n3. Checking .gitignore configuration...")
gitignore_path = Path('.gitignore')
if gitignore_path.exists():
    with open(gitignore_path, 'r') as f:
        content = f.read()
    if '__pycache__' not in content or '*.pyc' not in content:
        print("   ! Consider adding Python cache to .gitignore")
    else:
        print("   ✓ .gitignore is properly configured")
else:
    print("   ! No .gitignore found - creating one...")
    with open(gitignore_path, 'w') as f:
        f.write("""# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Node modules (if using build tools)
node_modules/
npm-debug.log

# Server-only files (not needed for GitHub Pages)
server.py
requirements.txt
model_artifacts/

# System files
.DS_Store
Thumbs.db
""")
    print("   ✓ .gitignore created")

print("\n" + "=" * 60)
print("Migration prep complete!")
print("=" * 60)
print("\nNext steps:")
print("1. Push changes to GitHub repository")
print("2. Enable GitHub Pages in repository settings")
print("   - Source: main branch /root or /docs folder")
print("   - Custom domain: (optional)")
print("3. Access your site at: https://<username>.github.io/TimeArcs")
print("\nNote: The AI Recommendation feature requires a backend server.")
print("      For offline use, only Manual Entry mode is available on GitHub Pages.")
print("=" * 60 + "\n")
