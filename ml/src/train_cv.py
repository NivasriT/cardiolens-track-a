import json
import time
import numpy as np
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from ml.src.data import ROOT, load_all

SCORING = ["accuracy", "precision", "recall", "f1", "roc_auc"]
CV = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)


def candidates(y):
    pos_weight = (y == 0).sum() / max((y == 1).sum(), 1)
    return {
        "LogReg": make_pipeline(
            SimpleImputer(strategy="median"), StandardScaler(),
            LogisticRegression(max_iter=3000, class_weight="balanced")),
        "RandomForest": make_pipeline(
            SimpleImputer(strategy="median"),
            RandomForestClassifier(n_estimators=300, class_weight="balanced_subsample",
                                   random_state=42)),
        "XGBoost": make_pipeline(
            SimpleImputer(strategy="median"),
            XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.05, subsample=0.8,
                          colsample_bytree=0.8, scale_pos_weight=pos_weight,
                          eval_metric="logloss", random_state=42)),
    }


def run():
    X, Y = load_all()
    results = {}
    for target, y in Y.items():
        results[target] = {}
        for name, model in candidates(y).items():
            t0 = time.time()
            cv = cross_validate(model, X, y, cv=CV, scoring=SCORING, n_jobs=-1)
            summary = {}
            for m in SCORING:
                s = cv["test_" + m]
                summary[m] = {"mean": float(s.mean()),
                              "ci_low": float(np.percentile(s, 2.5)),
                              "ci_high": float(np.percentile(s, 97.5))}
            results[target][name] = summary
            print(f"{target:4s} {name:13s} AUC {summary['roc_auc']['mean']:.3f}  "
                  f"recall {summary['recall']['mean']:.3f}  F1 {summary['f1']['mean']:.3f}  "
                  f"({time.time() - t0:.0f}s)")
    return results


if __name__ == "__main__":
    out = ROOT / "ml" / "reports" / "cv_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(run(), f, indent=2)
    print("saved", out)