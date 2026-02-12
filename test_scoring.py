#!/usr/bin/env python3
"""Test the enhanced scoring algorithm"""

import pandas as pd
import json
import urllib.request
import urllib.parse
import time

# Load a sample paper title
df = pd.read_csv('grants_final.tsv', sep='\t')
sample_paper = df.iloc[5]  # Get a sample paper
sample_title = sample_paper['Title'].strip('"')
sample_authors = str(sample_paper['Authors']).strip("'")
sample_author_list = [a.strip() for a in sample_authors.split(',')]

print(f'Sample Paper Title: {sample_title[:100]}...')
print(f'Sample Authors: {sample_author_list}')
print()

time.sleep(1)

# Test with exact title
url = 'http://localhost:8000/recommend_researchers'
data = urllib.parse.urlencode({'project_title': sample_title, 'top_n': '5'}).encode('utf-8')

try:
    response = urllib.request.urlopen(url, data)
    result = json.loads(response.read().decode('utf-8'))
    print('=== RECOMMENDATION RESULTS FOR EXACT PAPER MATCH ===')
    for idx, rec in enumerate(result['recommendations'][:5], 1):
        is_author = "*** AUTHOR OF INPUT PAPER ***" if rec['researcher'] in sample_author_list else ""
        print(f'{idx}. {rec["researcher"]}: Score={rec["score"]:.2f} {is_author}')
    
    print('\n=== BREAKDOWN FOR TOP RESULT ===')
    top_rec = result['recommendations'][0]
    print(f"Researcher: {top_rec['researcher']}")
    print(f"Keyword Score: {top_rec['breakdown']['keyword_score']:.2f}")
    print(f"Theme Score: {top_rec['breakdown']['theme_score']:.2f}")
    print(f"Total Score: {top_rec['score']:.2f}")
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
