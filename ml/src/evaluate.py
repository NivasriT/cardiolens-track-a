import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import shap
from sklearn.metrics import confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer

from ml.src.data import ROOT, load_all
from ml.src.save_baseline import make_model

REPORTS = ROOT / "ml" / "reports"
FIGS = REPORTS / "figures"
FIGS.mkdir(parents=True, exist_ok=True)

INK, TEAL, AMBER, RED = "#1b2430", "#2a9d8f", "#e9c46a", "#e63946"
plt.rcParams.update({"font.size": 12, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.edgecolor": INK, "axes.labelcolor": INK, "text.color": INK,
                     "xtick.color": INK, "ytick.color": INK})


def out_of_fold(X, y):
    """Honest predictions: every patient is predicted by a model that never saw them."""
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    model = make_pipeline(SimpleImputer(strategy="median"), make_model(y))
    return cross_val_predict(model, X, y, cv=cv, method="predict_proba")[:, 1]


def main():
    X, Y = load_all()
    cv_results = json.load(open(REPORTS / "cv_results.json"))
    metrics = {
        "dataset": {"name": "Z-Alizadeh Sani (extended)", "patients": int(len(X)), "inputs": int(X.shape[1]),
                    "licence": "CC BY 4.0", "doi": "10.24432/C5461K"},
        "validation": "Stratified 5-fold cross-validation repeated 3 times; intervals are the 2.5th-97.5th percentile over the 15 folds",
        "final_model": "XGBoost (all four targets)",
        "targets": {}, "comparison": cv_results,
    }
    oof_all = {}
    for t, y in Y.items():
        oof = out_of_fold(X, y)
        oof_all[t] = oof
        fpr, tpr, _ = roc_curve(y, oof)
        idx = np.linspace(0, len(fpr) - 1, min(60, len(fpr))).astype(int)
        cm = confusion_matrix(y, (oof >= 0.5).astype(int))
        metrics["targets"][t] = {
            "model": "XGBoost", "n": int(len(y)), "positives": int(y.sum()),
            "metrics": cv_results[t]["XGBoost"],
            "pooled_oof_auc": float(roc_auc_score(y, oof)),
            "roc_curve": {"fpr": [round(float(v), 4) for v in fpr[idx]], "tpr": [round(float(v), 4) for v in tpr[idx]]},
            "confusion_matrix_at_0.5": {"tn": int(cm[0, 0]), "fp": int(cm[0, 1]), "fn": int(cm[1, 0]), "tp": int(cm[1, 1])},
        }
        # ROC figure
        fig, ax = plt.subplots(figsize=(5, 4.4), dpi=200)
        ax.plot(fpr, tpr, color=TEAL, lw=2.5)
        ax.plot([0, 1], [0, 1], color="#9aa5b1", lw=1, ls="--")
        ax.set(xlabel="False positive rate", ylabel="True positive rate",
               title=f"{t}: ROC (pooled out-of-fold AUC {roc_auc_score(y, oof):.2f})")
        fig.tight_layout(); fig.savefig(FIGS / f"roc_{t}.png"); plt.close(fig)
        # confusion matrix figure
        fig, ax = plt.subplots(figsize=(4.4, 4), dpi=200)
        ax.imshow(cm, cmap="Blues")
        for i in range(2):
            for j in range(2):
                ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=16,
                        color="white" if cm[i, j] > cm.max() / 2 else INK)
        ax.set(xticks=[0, 1], yticks=[0, 1], xticklabels=["No stenosis", "Stenosis"],
               yticklabels=["No stenosis", "Stenosis"], xlabel="Predicted", ylabel="Actual",
               title=f"{t}: confusion matrix (threshold 0.5)")
        fig.tight_layout(); fig.savefig(FIGS / f"confusion_{t}.png"); plt.close(fig)

    # model comparison figure
    models = ["LogReg", "RandomForest", "XGBoost"]
    colours = ["#9aa5b1", AMBER, TEAL]
    fig, ax = plt.subplots(figsize=(7.5, 4.4), dpi=200)
    w = 0.26
    for k, m in enumerate(models):
        vals = [cv_results[t][m]["roc_auc"]["mean"] for t in Y]
        ax.bar(np.arange(len(Y)) + (k - 1) * w, vals, w, label=m, color=colours[k])
    ax.set(xticks=range(len(Y)), xticklabels=list(Y), ylabel="ROC-AUC (mean of 15 folds)", ylim=(0.5, 1.0),
           title="Model comparison")
    ax.legend(frameon=False)
    fig.tight_layout(); fig.savefig(FIGS / "model_comparison.png"); plt.close(fig)

    # SHAP summary for CAD
    model = make_model(Y["CAD"]); model.fit(X, Y["CAD"])
    values = shap.TreeExplainer(model).shap_values(X)
    plt.figure()
    shap.summary_plot(values, X, max_display=15, show=False)
    plt.title("CAD: what drives the predictions (SHAP)")
    plt.gcf().set_size_inches(8, 6); plt.tight_layout()
    plt.savefig(FIGS / "shap_summary_CAD.png", dpi=200); plt.close()

    json.dump(metrics, open(REPORTS / "metrics.json", "w"), indent=2)

    # demo patients chosen with the honest out-of-fold CAD probabilities
    p = oof_all["CAD"]; y = Y["CAD"].values
    low = [i for i in np.argsort(p) if y[i] == 0][:2]
    high = [i for i in np.argsort(-p) if y[i] == 1][:2]
    mid = [i for i in np.argsort(np.abs(p - 0.5)) if i not in low + high][:2]
    chosen = [(i, "Clear low risk") for i in low] + [(i, "Clear high risk") for i in high] + \
             [(i, "Borderline case") for i in mid]
    patients = []
    for n, (i, scenario) in enumerate(chosen):
        row = {c: (int(v) if float(v).is_integer() else round(float(v), 3)) for c, v in X.iloc[i].items()}
        patients.append({"id": f"patient_{chr(65 + n).lower()}", "label": f"Patient {chr(65 + n)}",
                         "scenario": scenario, "inputs": row})
    json.dump(patients, open(REPORTS / "sample_patients.json", "w"), indent=2)
    print("saved metrics.json, sample_patients.json and", len(list(FIGS.glob('*.png'))), "figures")


if __name__ == "__main__":
    main()