import joblib
from xgboost import XGBClassifier

from ml.src.data import ROOT, load_all


def make_model(y):
    pos_weight = (y == 0).sum() / max((y == 1).sum(), 1)
    return XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.05, subsample=0.8,
                         colsample_bytree=0.8, scale_pos_weight=pos_weight,
                         eval_metric="logloss", random_state=42)


if __name__ == "__main__":
    X, Y = load_all()
    bundle = {"features": list(X.columns), "models": {}}
    for target, y in Y.items():
        model = make_model(y)
        model.fit(X, y)                       # final model uses ALL 303 patients
        bundle["models"][target] = model
        print("fitted", target)
    out = ROOT / "ml" / "models" / "baseline.joblib"
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, out, compress=3)
    print("saved", out)