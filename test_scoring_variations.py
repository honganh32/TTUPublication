#!/usr/bin/env python3
"""Test scoring with various similarity levels"""

import json
import urllib.request
import urllib.parse
import time

url = 'http://localhost:8000/recommend_researchers'

test_cases = [
    ("Deep Learning for Computer Vision", "Generic related topic"),
    ("Machine Learning Applications", "Slightly related"),
    ("AI Across the Curriculum for Virtual Schools", "Exact/near-exact match test"),
]

time.sleep(1)

for title, description in test_cases:
    print(f'\n{"="*70}')
    print(f'Test: {description}')
    print(f'Input: "{title}"')
    print("="*70)
    
    data = urllib.parse.urlencode({'project_title': title, 'top_n': '5'}).encode('utf-8')
    
    try:
        response = urllib.request.urlopen(url, data)
        result = json.loads(response.read().decode('utf-8'))
        
        for idx, rec in enumerate(result['recommendations'][:3], 1):
            print(f'{idx}. {rec["researcher"]}: Score={rec["score"]:.2f} (Keyword: {rec["breakdown"]["keyword_score"]:.2f})')
            if rec.get('related_papers'):
                print(f'   Related papers: {len(rec["related_papers"])}')
                
    except Exception as e:
        print(f'Error: {e}')
