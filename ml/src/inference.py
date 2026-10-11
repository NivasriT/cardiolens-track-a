import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

ML_DIR = Path(__file__).resolve().parents[1]
SCHEMA = json.load(open(ML_DIR / "feature_schema.json", encoding="utf-8"))
TARGETS = ["CAD", "LAD", "LCX", "RCA"]

# Typical value used when an input was not entered: median for numbers, 0 ("absent") otherwise
DEFAULTS = {f["name"]: (f["median"] if f["type"] == "number" else 0) for f in SCHEMA["features"]}


class RiskModel:
    def __init__(self):
        bundle = joblib.load(ML_DIR / "models" / "baseline.joblib")
        self.features = bundle["features"]
        self.models = bundle["models"]
        self._explainers = {}

    def _row(self, patient: dict) -> pd.DataFrame:
        row = {c: patient.get(c, DEFAULTS[c]) for c in self.features}   # missing -> typical value
        return pd.DataFrame([row], columns=self.features).astype(float)

    def predict(self, patient: dict, groups: list) -> dict:
        X = self._row(patient)
        out = {}
        for t in TARGETS:
            p = float(self.models[t].predict_proba(X)[0, 1])
            out[t] = {"p": p, "lo": p, "hi": p}     # confidence interval arrives with the extra
        return out

    def explain(self, patient: dict, groups: list, target: str, top_k: int = 6) -> list:
        X = self._row(patient)
        if target not in self._explainers:
            self._explainers[target] = shap.TreeExplainer(self.models[target])
        values = np.array(self._explainers[target].shap_values(X)).reshape(-1)
        items = []
        for i in np.argsort(-np.abs(values)):
            name = self.features[i]
            if name not in patient:               # only explain what was actually entered
                continue
            items.append({"feature": name, "value": patient[name], "shap": float(values[i])})
            if len(items) == top_k:
                break
        return items

    def next_best_test(self, patient: dict, groups: list):
        return None                                # added later (the extra idea)