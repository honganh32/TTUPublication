#!/usr/bin/env python3
"""
Convert grants_final.tsv to grants_final.json for GitHub Pages deployment.
Run this script to generate the JSON data file that will be used by the client-side JavaScript.

Usage:
    python tsv_to_json.py
"""

import json
import csv
from pathlib import Path

def tsv_to_json(input_file='grants_final.tsv', output_file='data/grants_final.json'):
    """Convert TSV file to JSON format for client-side loading."""
    
    input_path = Path(input_file)
    output_path = Path(output_file)
    
    if not input_path.exists():
        print(f"Error: {input_file} not found")
        return False
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        data = []
        with open(input_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                # Clean up quoted values
                cleaned_row = {
                    'code': row['Code'].strip().strip('"'),
                    'time': int(row['Time'].strip()),
                    'theme': row['Theme'].strip().strip('"'),
                    'title': row['Title'].strip().strip("'"),
                    'authors': row['Authors'].strip().strip('"')
                }
                data.append(cleaned_row)
        
        # Write to JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Successfully converted {input_file} to {output_file}")
        print(f"  Total records: {len(data)}")
        return True
        
    except Exception as e:
        print(f"Error converting file: {e}")
        return False

if __name__ == '__main__':
    tsv_to_json('grants_final.tsv', 'data/grants_final.json')
