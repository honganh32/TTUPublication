#!/usr/bin/env python3
"""
Compare old vs improved theme prediction model
"""

comparison_data = {
    "Quantum": {
        "old": ("Education & Workforce Development", 0.338),
        "improved": ("Quantum", 0.171)
    },
    "Quantum Computing": {
        "old": ("Education & Workforce Development", 0.400),
        "improved": ("Quantum", 0.165)
    },
    "Healthcare": {
        "old": ("Education & Workforce Development", 0.338),
        "improved": ("Healthcare / Biomedical", 0.106)
    },
    "Cybersecurity": {
        "old": ("Education & Workforce Development", 0.406),
        "improved": ("Education & Workforce Development", 0.113)  # Still not ideal but better
    },
    "Deep Learning": {
        "old": ("Education & Workforce Development", 0.384),
        "improved": ("Education & Workforce Development", 0.118)
    }
}

print("="*90)
print("THEME PREDICTION MODEL IMPROVEMENTS")
print("="*90)
print("\nCOMPARISON: OLD MODEL vs IMPROVED MODEL")
print("-"*90)
print(f"{'Input':<25} {'OLD Prediction':<40} {'NEW Prediction':<25}")
print("-"*90)

for input_text, predictions in comparison_data.items():
    old_theme, old_prob = predictions['old']
    new_theme, new_prob = predictions['improved']
    
    status = "✓ FIXED" if old_theme != new_theme else "(unchanged)"
    
    print(f"{input_text:<25} {old_theme:<40} {new_theme:<25}")
    print(f"{'':25} (prob: {old_prob:.3f}){'':33} (prob: {new_prob:.3f}) {status}")
    print()

print("="*90)
print("KEY IMPROVEMENTS MADE:")
print("="*90)
print("""
1. BALANCED CLASS WEIGHTS
   - Added: class_weight='balanced' to LogisticRegression
   - Effect: Handles severe class imbalance (Education had 24.2% of samples)
   
2. STRONGER REGULARIZATION  
   - Changed: C=1.0 (default) → C=0.5 (increase regularization)
   - Effect: Prevents overfitting to dominant class
   
3. BETTER SOLVER
   - Changed: solver='liblinear' (default) → solver='lbfgs'
   - Effect: Better performance on small datasets with many features
   
4. INCLUDED MORE THEMES IN TRAINING
   - Changed: MIN_SAMPLES_PER_THEME from 4 → 2
   - Effect: Now includes "Quantum" theme (had 3 samples)
   
5. HIGHER MAX ITERATIONS
   - Changed: max_iter=1000 → max_iter=2000
   - Effect: Allows model to converge better

RESULT:
✅ "Quantum" input now correctly predicts "Quantum" theme (was "Education...")
✅ "Healthcare" input now correctly predicts "Healthcare / Biomedical"
✅ Less probability mass on the dominant "Education & Workforce Development" class
✅ More balanced predictions across all classes
""")
