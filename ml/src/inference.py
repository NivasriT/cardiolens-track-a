import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

from ml.src.ensemble import confidence_label, key_of, predict_batch, summarise
from ml.src.groups import GROUP_OF, OPTIONAL_GROUPS, columns_for

ML_DIR = Path(__file__).resolve().parents[1]
MODELS = ML_DIR / "models"
SCHEMA = json.load(open(ML_DIR / "feature_schema.json"))
ALL_FEATURES = [f["name"] for f in SCHEMA["features"]]


def _num(v):
    try:
        if v is None or v == "":
            return np.nan
        return float(v)
    except (TypeError, ValueError):
        return np.nan


class RiskModel:
    def __init__(self):
        bundle = joblib.load(MODELS / "groups.joblib")
        self.sets = bundle["models"]
        meta = bundle["meta"]
        self.columns = meta["columns"]
        self.medians = pd.Series(meta["medians"])
        self.train_X = meta["train_X"]
        self.thresholds = meta["conf_thresholds"]
        self._mean = self.train_X.mean()
        self._std = self.train_X.std(ddof=0).replace(0, 1.0)
        self._explainers = {}

    # ---------- helpers ----------
    def _frame(self, patient):
        """One-row DataFrame. Missing or invalid inputs get the typical (median) value."""
        row = {c: _num(patient.get(c)) for c in self.columns}
        return pd.DataFrame([row]).fillna(self.medians)

    def _predict_frame(self, df, groups):
        out = {}
        for t, e in self.sets[key_of(groups)].items():
            out[t] = summarise(predict_batch(e["models"], e["cols"], df))
        return out

    def _nearest(self, patient, groups, k=30):
        cols = columns_for(list(groups), self.columns)
        x = (self._frame(patient)[cols].iloc[0] - self._mean[cols]) / self._std[cols]
        Z = (self.train_X[cols] - self._mean[cols]) / self._std[cols]
        d = ((Z - x) ** 2).sum(axis=1)
        return self.train_X.loc[d.nsmallest(k).index]

    # ---------- public interface ----------
    def predict(self, patient, groups):
        res = self._predict_frame(self._frame(patient), groups)
        out = {}
        for t, (p, lo, hi) in res.items():
            width = float(hi[0] - lo[0])
            out[t] = {"p": float(p[0]), "lo": float(lo[0]), "hi": float(hi[0]),
                      "width": width, "confidence": confidence_label(width, self.thresholds)}
        return out

    def explain(self, patient, groups, target, top_k=6):
        key = key_of(groups)
        entry = self.sets[key][target]
        model, cols = entry["models"][0], entry["cols"]
        if (key, target) not in self._explainers:
            self._explainers[(key, target)] = shap.TreeExplainer(model)
        df = self._frame(patient)[cols]
        sv = self._explainers[(key, target)].shap_values(df)
        if isinstance(sv, list):
            sv = sv[-1]
        sv = np.array(sv).reshape(-1)  # log-odds, one value per feature
        provided = {c for c in cols if c in patient and not pd.isna(_num(patient.get(c)))}
        order = [i for i in np.argsort(-np.abs(sv)) if cols[i] in provided][:top_k]
        return [{"feature": cols[i], "value": float(df.iloc[0, i]), "shap": float(sv[i])} for i in order]

    def next_best_test(self, patient, groups):
        groups = list(groups)
        missing = [g for g in OPTIONAL_GROUPS if g not in groups]
        if not missing:
            return None
        base_df = self._frame(patient)
        now = self._predict_frame(base_df, groups)
        width_now = float(np.mean([(hi - lo)[0] for (_, lo, hi) in now.values()]))
        neighbours = self._nearest(patient, groups, k=30)
        ranking = []
        for g in missing:
            df = pd.concat([base_df] * len(neighbours), ignore_index=True)
            gcols = [c for c in self.columns if GROUP_OF[c] == g]
            df[gcols] = neighbours[gcols].to_numpy()
            res = self._predict_frame(df, groups + [g])
            widths = np.mean([hi - lo for (_, lo, hi) in res.values()], axis=0)
            ranking.append({"group": g, "expected_uncertainty_reduction": float(width_now - widths.mean())})
        ranking.sort(key=lambda r: -r["expected_uncertainty_reduction"])
        return {"recommended_group": ranking[0]["group"], "ranking": ranking}