#!/usr/bin/env python3
"""
Convert scikit-learn models to ONNX format for browser-based inference.
This script converts the trained models from pickle format to ONNX format
for use with ONNX Runtime Web (onnxruntime-web).

Requirements:
    pip install skl2onnx onnx onnxruntime scikit-learn numpy pandas

Usage:
    python convert_models_to_onnx.py
"""

import pickle
import json
from pathlib import Path
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType, StringTensorType

def convert_models():
    """Convert scikit-learn models to ONNX format."""
    
    model_dir = Path("model_artifacts")
    
    if not model_dir.exists():
        print(f"❌ Error: {model_dir} directory not found!")
        print("Please run train_model.ipynb first to generate model files.")
        return False
    
    print("🔄 Converting models to ONNX format for GitHub Pages...")
    print("-" * 60)
    
    try:
        # Load the models
        print("\n1️⃣  Loading TF-IDF vectorizer...")
        with open(model_dir / "tfidf_vectorizer.pkl", "rb") as f:
            tfidf_vectorizer = pickle.load(f)
        print("   ✓ Loaded successfully")
        
        print("\n2️⃣  Loading logistic regression model...")
        with open(model_dir / "logistic_model.pkl", "rb") as f:
            logistic_model = pickle.load(f)
        print("   ✓ Loaded successfully")
        
        print("\n3️⃣  Loading label encoder...")
        with open(model_dir / "label_encoder.pkl", "rb") as f:
            label_encoder = pickle.load(f)
        print("   ✓ Loaded successfully")
        
        # Convert TF-IDF vectorizer to ONNX
        print("\n4️⃣  Converting TF-IDF vectorizer to ONNX...")
        initial_type_tfidf = [('input', StringTensorType([None, 1]))]
        
        onnx_tfidf = convert_sklearn(
            tfidf_vectorizer,
            initial_types=initial_type_tfidf,
            target_opset=12,
            options={id(tfidf_vectorizer): {'tokenexp': '\\w{1,}'}},
        )
        
        tfidf_path = model_dir / "tfidf_vectorizer.onnx"
        with open(tfidf_path, "wb") as f:
            f.write(onnx_tfidf.SerializeToString())
        print(f"   ✓ Saved to {tfidf_path}")
        
        # Convert logistic regression model to ONNX
        print("\n5️⃣  Converting logistic regression model to ONNX...")
        n_features = logistic_model.coef_.shape[1]
        initial_type_lr = [('input', FloatTensorType([None, n_features]))]
        
        onnx_lr = convert_sklearn(
            logistic_model,
            initial_types=initial_type_lr,
            target_opset=12,
        )
        
        lr_path = model_dir / "logistic_model.onnx"
        with open(lr_path, "wb") as f:
            f.write(onnx_lr.SerializeToString())
        print(f"   ✓ Saved to {lr_path}")
        
        # Convert label encoder to JSON (for JavaScript usage)
        print("\n6️⃣  Converting label encoder to JSON...")
        label_encoder_dict = {
            'classes': label_encoder.classes_.tolist()
        }
        
        json_path = model_dir / "label_encoder.json"
        with open(json_path, "w") as f:
            json.dump(label_encoder_dict, f, indent=2)
        print(f"   ✓ Saved to {json_path}")
        
        # Test the converted models
        print("\n7️⃣  Testing converted models...")
        try:
            import onnxruntime as rt
            
            # Test TF-IDF
            sess_tfidf = rt.InferenceSession(str(tfidf_path))
            test_input = np.array([["machine learning"]])
            input_name = sess_tfidf.get_inputs()[0].name
            output_name = sess_tfidf.get_outputs()[0].name
            result = sess_tfidf.run([output_name], {input_name: test_input})
            print(f"   ✓ TF-IDF test passed (output shape: {result[0].shape})")
            
            # Test logistic regression
            sess_lr = rt.InferenceSession(str(lr_path))
            features = result[0].astype(np.float32)
            input_name_lr = sess_lr.get_inputs()[0].name
            output_names_lr = [output.name for output in sess_lr.get_outputs()]
            result_lr = sess_lr.run(output_names_lr, {input_name_lr: features})
            print(f"   ✓ Logistic regression test passed")
            print(f"     Number of outputs: {len(result_lr)}")
            print(f"     Probabilities shape: {result_lr[1].shape}")
            
        except ImportError:
            print("   ⚠ Warning: onnxruntime not installed, skipping validation")
            print("   Install with: pip install onnxruntime")
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! All models converted to ONNX format")
        print("=" * 60)
        print("\nGenerated files:")
        print(f"  • {tfidf_path}")
        print(f"  • {lr_path}")
        print(f"  • {json_path}")
        print("\n📝 Next steps:")
        print("  1. Commit the ONNX files to your repository")
        print("  2. Deploy to GitHub Pages")
        print("  3. The recommendation system will work client-side!")
        
        return True
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("Please run train_model.ipynb first to generate model files.")
        return False
    except Exception as e:
        print(f"\n❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  ONNX Model Converter for GitHub Pages")
    print("=" * 60)
    
    success = convert_models()
    
    if not success:
        print("\n❌ Conversion failed. Please check the errors above.")
        exit(1)
    else:
        print("\n🎉 All done! Your project is ready for GitHub Pages.")
        exit(0)
