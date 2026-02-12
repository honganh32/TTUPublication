#!/usr/bin/env python3
"""Test the improved theme prediction model"""

import json
import urllib.request
import urllib.parse
import time

url = 'http://localhost:8000/recommend_researchers'

test_cases = [
    "Quantum",
    "Quantum Computing",
    "Quantum Cryptography",
    "Deep Learning",
    "Healthcare",
    "Cybersecurity",
    "Machine Learning",
]

time.sleep(1)

print("="*70)
print("IMPROVED MODEL THEME PREDICTION TESTS")
print("="*70)

for test_input in test_cases:
    data = urllib.parse.urlencode({'project_title': test_input, 'top_n': '1'}).encode('utf-8')
    
    try:
        response = urllib.request.urlopen(url, data)
        result = json.loads(response.read().decode('utf-8'))
        theme = result.get('predicted_theme', 'Unknown')
        top_rec = result['recommendations'][0]
        
        print(f"\nInput: '{test_input}'")
        print(f"  → Predicted Theme: {theme}")
        print(f"  → Top Researcher: {top_rec['researcher']} (Score: {top_rec['score']:.2f})")
                
    except Exception as e:
        print(f"\nInput: '{test_input}'")
        print(f"  → Error: {e}")
