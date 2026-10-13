import json
from ml.src.data import ROOT, load_raw, encode, make_features
from ml.src.groups import GROUP_OF

LABELS = {
    "Age": "Age (years)", "Weight": "Weight (kg)", "Length": "Height (cm)", "Sex": "Sex",
    "BMI": "BMI (kg/m²)", "DM": "Diabetes mellitus", "HTN": "Hypertension",
    "Current Smoker": "Current smoker", "EX-Smoker": "Ex-smoker", "FH": "Family history of CAD",
    "Obesity": "Obesity", "CRF": "Chronic renal failure", "CVA": "Stroke (cerebrovascular accident)",
    "Airway disease": "Airway disease", "Thyroid Disease": "Thyroid disease",
    "CHF": "Congestive heart failure", "DLP": "Dyslipidemia", "BP": "Blood pressure (mmHg)",
    "PR": "Pulse rate (bpm)", "Edema": "Edema", "Weak Peripheral Pulse": "Weak peripheral pulse",
    "Lung rales": "Lung rales", "Systolic Murmur": "Systolic murmur", "Diastolic Murmur": "Diastolic murmur",
    "Typical Chest Pain": "Typical chest pain", "Dyspnea": "Shortness of breath (dyspnea)",
    "Function Class": "Functional class (0-3)", "Atypical": "Atypical chest pain",
    "Nonanginal": "Non-anginal chest pain", "LowTH Ang": "Low-threshold angina",
    "Q Wave": "Q wave (ECG)", "St Elevation": "ST elevation (ECG)", "St Depression": "ST depression (ECG)",
    "Tinversion": "T-wave inversion (ECG)", "LVH": "Left ventricular hypertrophy (ECG)",
    "Poor R Progression": "Poor R-wave progression (ECG)", "BBB": "Bundle branch block (ECG)",
    "FBS": "Fasting blood sugar (mg/dL)", "CR": "Creatinine (mg/dL)", "TG": "Triglycerides (mg/dL)",
    "LDL": "LDL cholesterol (mg/dL)", "HDL": "HDL cholesterol (mg/dL)", "BUN": "Blood urea nitrogen (mg/dL)",
    "ESR": "Erythrocyte sedimentation rate (mm/h)", "HB": "Hemoglobin (g/dL)", "K": "Potassium (mEq/L)",
    "Na": "Sodium (mEq/L)", "WBC": "White blood cells (cells/mL)", "Lymph": "Lymphocytes (%)",
    "Neut": "Neutrophils (%)", "PLT": "Platelets (1000/mL)", "EF-TTE": "Ejection fraction, echo (%)",
    "Region RWMA": "Wall-motion abnormality regions (0-4)", "VHD": "Valvular heart disease",
}

CHOICES = {
    "Sex": {"Female": 0, "Male": 1},
    "BBB": {"None": 0, "LBBB": 1, "RBBB": 2},
    "VHD": {"None": 0, "Mild": 1, "Moderate": 2, "Severe": 3},
}


def main():
    X = make_features(encode(load_raw()))
    assert set(X.columns) == set(GROUP_OF), set(X.columns) ^ set(GROUP_OF)
    features = []
    for col in X.columns:
        s = X[col]
        item = {"name": col, "label": LABELS.get(col, col), "group": GROUP_OF[col]}
        if col in CHOICES:
            item.update(type="choice", choices=CHOICES[col])
        elif set(s.unique()) <= {0, 1}:
            item.update(type="binary")
        else:
            lo, hi = float(s.min()), float(s.max())
            span = hi - lo
            item.update(type="number", min=lo, max=hi, median=float(s.median()),
                        valid_min=max(0.0, lo - 0.5 * span), valid_max=hi + 0.5 * span)
        features.append(item)
    out = {"features": features, "groups": ["base", "ecg", "labs", "echo"]}
    path = ROOT / "ml" / "feature_schema.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print("wrote", path, "with", len(features), "features")


if __name__ == "__main__":
    main()