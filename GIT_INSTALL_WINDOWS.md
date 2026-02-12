# Installing Git on Windows

## Quick Install (Recommended)

### Option 1: Standalone Installer (Easiest)

1. Download Git for Windows:
   ```
   https://git-scm.com/download/win
   ```

2. Run the installer (git-2.x.x-64-bit.exe)

3. Installation steps:
   - Click "Next" through all pages, OR
   - Use recommended settings (defaults are fine)
   - **Important**: Select "Use Git from Windows Command Prompt" when asked
   - Choose "Checkout Windows-style, commit Unix-style line endings"
   - Click "Finish"

4. **Restart VS Code** (important!)

5. Verify installation:
   ```powershell
   git --version
   ```
   Should show: `git version 2.x.x.windows.x`

### Option 2: Using Windows Package Manager (If Installed)

```powershell
# If you have winget installed:
winget install --id Git.Git -e --source winget
```

### Option 3: Using Chocolatey (If Installed)

```powershell
# As Administrator:
choco install git
```

---

## After Installation Complete

1. **Restart VS Code and all terminals** (critical!)

2. Verify git works:
   ```powershell
   git --version
   ```

3. Configure git:
   ```powershell
   git config --global user.name "Your Full Name"
   git config --global user.email "your.email@github.com"
   ```

4. Initialize repository in TTUPublication folder:
   ```powershell
   cd e:\TimeArcs-master\TimeArcs-master\TTUPublication
   git init
   git add .
   git commit -m "Initial commit: TTUPublication researcher recommendation system"
   ```

5. Add remote and push:
   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/TTUPublication.git
   git push -u origin main
   ```

---

## Troubleshooting

**If "git: command not found" still appears:**

1. Close ALL terminals and VS Code
2. Restart your computer (ensure Git installer completed)
3. Open new terminal/VS Code
4. Try again

**If PATH issues persist:**

```powershell
# Check where Git was installed
where git

# If empty, add to PATH manually:
# Control Panel > System > Advanced > Environment Variables
# Add: C:\Program Files\Git\cmd
# Restart computer
```

---

## Next Steps

Once Git is installed and verified, return to **GITHUB_QUICK_START.md** and follow the 6-step process.

See you on the other side! 🚀
