#!/usr/bin/env python3
"""
Simple HTTP server for the TTUPublication project with POST support for adding projects and recommendations.
Run this script to start the server on localhost:8000
"""

import http.server
import socketserver
import json
import os
from urllib.parse import parse_qs
from pathlib import Path

PORT = 8000
GRANTS_FILE = "grants_final.tsv"

try:
    from recommend_researchers import get_recommendations
    RECOMMENDATION_AVAILABLE = True
except ImportError:
    RECOMMENDATION_AVAILABLE = False
    print("[WARNING] recommend_researchers module not available. Recommendation feature disabled.")

class ProjectHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve static files normally
        super().do_GET()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        # Handle POST requests
        if self.path in ['/add_project', '/add_project.php']:
            content_length = int(self.headers.get('Content-Length', 0))
            
            try:
                post_data = self.rfile.read(content_length).decode('utf-8')
                
                # Parse form data
                params = parse_qs(post_data)
                code = params.get('code', [''])[0].strip()
                time = params.get('time', [''])[0].strip()
                theme = params.get('theme', [''])[0].strip()
                title = params.get('title', [''])[0].strip()
                authors = params.get('authors', [''])[0].strip()
                
                print(f"[POST] Received: code={code}, time={time}, theme={theme}")
                
                # Validate inputs
                if not all([code, time, theme, title, authors]):
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode())
                    print("[ERROR] Missing fields")
                    return
                
                # Format the new row matching the existing TSV format
                new_row = f'"{code}"\t{time}\t"{theme}"\t\'{title}\'\t"{authors}"\n'
                
                # Append to the TSV file
                grants_path = Path(GRANTS_FILE)
                if not grants_path.exists():
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': f'grants_final.tsv not found at {grants_path.absolute()}'}).encode())
                    print(f"[ERROR] File not found: {grants_path.absolute()}")
                    return
                
                # Write to file
                with open(grants_path, 'a', encoding='utf-8') as f:
                    f.write(new_row)
                
                print(f"[SUCCESS] Added new project: {code}")
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Project added successfully'}).encode())
                
            except Exception as e:
                print(f"[ERROR] {str(e)}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        
        elif self.path == '/recommend_researchers':
            if not RECOMMENDATION_AVAILABLE:
                self.send_response(503)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Recommendation engine not available. Please run train_model.ipynb first.'}).encode())
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            
            try:
                post_data = self.rfile.read(content_length).decode('utf-8')
                params = parse_qs(post_data)
                
                project_title = params.get('project_title', [''])[0].strip()
                target_theme = params.get('target_theme', [''])[0].strip() or None
                top_n = int(params.get('top_n', ['5'])[0])
                
                if not project_title:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'project_title is required'}).encode())
                    return
                
                print(f"[RECOMMEND] Processing: {project_title}")
                
                # Get recommendations
                result = get_recommendations(project_title, target_theme, top_n)
                
                print(f"[RECOMMEND] Found {len(result['recommendations'])} recommendations for theme: {result['predicted_theme']}")
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                print(f"[ERROR] Recommendation failed: {str(e)}")
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Endpoint not found'}).encode())
            print(f"[404] Unknown endpoint: {self.path}")
    
    def log_message(self, format, *args):
        # Custom logging with timestamps
        print(f"[{self.client_address[0]}] {format%args}")

if __name__ == '__main__':
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"Starting server in: {script_dir}")
    print(f"Looking for grants_final.tsv at: {os.path.join(script_dir, GRANTS_FILE)}")
    
    try:
        with socketserver.TCPServer(("", PORT), ProjectHandler) as httpd:
            print(f"\n✓ Server running at http://localhost:{PORT}")
            print(f"✓ Open http://localhost:{PORT}/index.html in your browser")
            print(f"✓ Press Ctrl+C to stop the server\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except OSError as e:
        print(f"ERROR: Could not start server - {e}")
        print(f"Port {PORT} might be in use. Try a different port.")
