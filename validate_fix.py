#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
import time

time.sleep(1)
url = 'http://localhost:8000/recommend_researchers'

test_queries = [
    ('Quantum', 'Should predict Quantum'),
    ('Quantum Computing', 'Should predict Quantum'),
    ('Healthcare Research', 'Should predict Healthcare'),
]

print('\n✓ IMPROVED MODEL VALIDATION TEST')
print('='*70)

for query, expected in test_queries:
    data = urllib.parse.urlencode({'project_title': query, 'top_n': '3'}).encode('utf-8')
    response = urllib.request.urlopen(url, data)
    result = json.loads(response.read().decode('utf-8'))
    theme = result['predicted_theme']
    
    print(f'\nQuery: "{query}"')
    print(f'Expected: {expected}')
    print(f'Actual: Predicted Theme = {theme}')
    
    if 'Quantum' in query and theme == 'Quantum':
        print('✅ PASS')
    elif 'Healthcare' in query and 'Healthcare' in theme:
        print('✅ PASS')
    else:
        print('❌ Still needs work')

print('\n' + '='*70)
