# TTUPublication - Setup Instructions

## Running the "Add Project" Feature

To use the "Add New Project" functionality, you need to run a local web server that can handle file uploads and modifications.

### Option 1: Using the Python Server (Recommended)

1. Open PowerShell or Command Prompt
2. Navigate to the TTUPublication directory:
   ```
   cd e:\TimeArcs-master\TimeArcs-master\TTUPublication
   ```
3. Run the Python server:
   ```
   python server.py
   ```
   Or if `python` doesn't work, try:
   ```
   python3 server.py
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000/index.html
   ```
5. The "Add New Project" form will now be fully functional
6. To stop the server, press `Ctrl+C` in the terminal

### Option 2: Using Python's Built-in Server

If you prefer not to use the custom server script:

1. Open PowerShell or Command Prompt
2. Navigate to the TTUPublication directory:
   ```
   cd e:\TimeArcs-master\TimeArcs-master\TTUPublication
   ```
3. Start a simple Python HTTP server:
   ```
   python -m http.server 8000
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000/index.html
   ```

**Note:** Option 2 will only work if you run the custom `server.py` script from Option 1, as the standard HTTP server doesn't support POST requests for custom endpoints.

## Features

- **View all research projects** in a nicely formatted list
- **Add new projects** with the form at the top of the page:
  - Code (e.g., "24-0001")
  - Time/Year (e.g., 2024)
  - Theme (e.g., "AI / Machine Learning")
  - Title (project title)
  - Authors (comma-separated list)
- New projects are automatically added to `grants_final.tsv`
- The visualization updates automatically after adding a new project
