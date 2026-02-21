#!/usr/bin/env python3
"""
Convert scikit-learn models to ONNX format for JavaScript/Browser use.

This allows the recommendation engine to run directly in the browser
without needing a Python server.

Requirements:
    pip install skl2onnx onnx onnxruntime

Usage:
    python convert_models_to_onnx.py
"""

import os
import pickle
import numpy as np
from pathlib import Path

try:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import StringTensorType, FloatTensorType
    import onnx
    HAS_SKL2ONNX = True
except ImportError:
    HAS_SKL2ONNX = False
    print("[ERROR] skl2onnx not installed")
    print("Install with: pip install skl2onnx onnx")

def convert_tfidf_vectorizer():
    """Convert TF-IDF vectorizer to ONNX"""
    print("\n1. Converting TF-IDF Vectorizer...")
    
    try:
        with open('model_artifacts/tfidf_vectorizer.pkl', 'rb') as f:
            vectorizer = pickle.load(f)
        
        # Get feature count from vocabulary
        n_features = len(vectorizer.vocabulary_) if hasattr(vectorizer, 'vocabulary_') else 300
        
        # Create ONNX model
        initial_type = [('string_input', StringTensorType([None, 1]))]
        
        onx = convert_sklearn(
            vectorizer,
            initial_types=initial_type,
            target_opset=12
        )
        
        with open('model_artifacts/tfidf_vectorizer.onnx', 'wb') as f:
            f.write(onx.SerializeToString())
        
        print("   ✓ TF-IDF vectorizer converted")
        print(f"   Input: text string (shape: [batch_size, 1])")
        print(f"   Output: dense vector (shape: [batch_size, {n_features}])")
        return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def convert_logistic_model():
    """Convert Logistic Regression model to ONNX"""
    print("\n2. Converting Logistic Regression Model...")
    
    try:
        with open('model_artifacts/logistic_model.pkl', 'rb') as f:
            model = pickle.load(f)
        
        # Create ONNX model
        initial_type = [('float_input', FloatTensorType([None, model.n_features_in_]))]
        
        onx = convert_sklearn(
            model,
            initial_types=initial_type,
            target_opset=12
        )
        
        with open('model_artifacts/logistic_model.onnx', 'wb') as f:
            f.write(onx.SerializeToString())
        
        print("   ✓ Logistic model converted")
        print(f"   Input: feature vector (shape: [batch_size, {model.n_features_in_}])")
        print(f"   Output: class probabilities (shape: [batch_size, {len(model.classes_)}])")
        return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def convert_label_encoder():
    """Export label encoder mapping as JSON"""
    print("\n3. Exporting Label Encoder...")
    
    try:
        with open('model_artifacts/label_encoder.pkl', 'rb') as f:
            encoder = pickle.load(f)
        
        # Create JSON mapping
        import json
        
        mapping = {
            'classes': list(encoder.classes_),
            'class_indices': {cls: idx for idx, cls in enumerate(encoder.classes_)}
        }
        
        with open('model_artifacts/label_encoder.json', 'w') as f:
            json.dump(mapping, f, indent=2)
        
        print("   ✓ Label encoder exported")
        print(f"   Classes: {list(encoder.classes_)}")
        return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def print_onnx_info(onnx_file):
    """Print information about ONNX model"""
    try:
        model = onnx.load(onnx_file)
        print(f"\n   ONNX Model Info ({onnx_file}):")
        print(f"   - Inputs: {[inp.name for inp in model.graph.input]}")
        print(f"   - Outputs: {[out.name for out in model.graph.output]}")
    except Exception as e:
        print(f"   - Could not read ONNX info: {e}")

if __name__ == '__main__':
    print("=" * 70)
    print("Convert Scikit-Learn Models to ONNX")
    print("=" * 70)
    
    if not HAS_SKL2ONNX:
        print("\n[ERROR] Required dependencies not installed")
        print("\nInstall with:")
        print("  pip install skl2onnx onnx onnxruntime")
        exit(1)
    
    # Check if model files exist
    if not Path('model_artifacts/logistic_model.pkl').exists():
        print("[ERROR] Model files not found in model_artifacts/")
        print("Run: jupyter notebook train_model.ipynb")
        exit(1)
    
    print("\nConverting models to ONNX format...\n")
    
    success = True
    success &= convert_tfidf_vectorizer()
    success &= convert_logistic_model()
    success &= convert_label_encoder()
    
    if success:
        print("\n" + "=" * 70)
        print("✓ All models converted successfully!")
        print("=" * 70)
        
        print("\nGenerated files:")
        print("  - model_artifacts/tfidf_vectorizer.onnx")
        print("  - model_artifacts/logistic_model.onnx")
        print("  - model_artifacts/label_encoder.json")
        
        print("\nNext steps:")
        print("  1. Install ONNX Runtime in browser: add script tag")
        print("  2. Load models in JavaScript using ONNX.js")
        print("  3. Use RecommendationEngine.js to compute recommendations")
        
        print("\nInclude in index.html:")
        print("  <script src=\"https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.all.min.js\"></script>")
        print("  <script src=\"pubJavascripts/myscripts/recommendation-engine.js\"></script>")
        
        print("\n" + "=" * 70 + "\n")
    else:
        print("\n[ERROR] Some conversions failed\n")
        exit(1)
