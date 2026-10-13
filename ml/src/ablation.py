import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.pipeline import make_pipeline

from ml.src.data import ROOT, load_all
from ml.src.ensemble import all_subsets, key_of
from ml.src.groups import columns_for
from ml.src.save_baseline import make_model

REPORTS = ROOT / "ml" / "reports"
FIGS = REPORTS / "figures"
FIGS.mkdir(parents=True, exist_ok=True)
INK, TEAL = "#1b2430", "#2a9d8f"
plt.rcParams.update({"font.size": 12, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.edgecolor": INK, "axes.labelcolor": INK, "text.color": INK,
                     "xtick.color": INK, "ytick.color": INK})


def main():
    X, Y = load_all()
    y = Y["CAD"]
    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)
    results = {}
    for groups in all_subsets():
        key = key_of(groups)
        cols = columns_for(groups, list(X.columns))
        model = make_pipeline(SimpleImputer(strategy="median"), make_model(y))
        s = cross_validate(model, X[cols], y, cv=cv, scoring="roc_auc", n_jobs=-1)["test_score"]
        results[key] = {"inputs": len(cols), "mean": float(s.mean()),
                        "ci_low": float(np.percentile(s, 2.5)), "ci_high": float(np.percentile(s, 97.5))}
        print(f"{key:<22} inputs={len(cols):<3} AUC={s.mean():.3f}")

    json.dump({"target": "CAD", "metric": "roc_auc", "results": results},
              open(REPORTS / "ablation.json", "w"), indent=2)

    keys = list(results)
    means = [results[k]["mean"] for k in keys]
    err = [[results[k]["mean"] - results[k]["ci_low"] for k in keys],
           [results[k]["ci_high"] - results[k]["mean"] for k in keys]]
    fig, ax = plt.subplots(figsize=(10, 5), dpi=200)
    bars = ax.bar(range(len(keys)), means, color=TEAL, yerr=err, capsize=4, ecolor=INK)
    for b, m in zip(bars, means):
        ax.text(b.get_x() + b.get_width() / 2, 0.52, f"{m:.2f}", ha="center", color="white", fontsize=12)
    ax.set(xticks=range(len(keys)), ylim=(0.5, 1.0), ylabel="CAD ROC-AUC (15 folds)",
           title="How much is each group of tests worth?")
    ax.set_xticklabels([k.replace("base+", "base\n+") .replace("+", " +\n") if False else k.replace("+", "\n+") for k in keys],
                       fontsize=10)
    fig.tight_layout()
    fig.savefig(FIGS / "test_value_ablation.png")
    plt.close(fig)
    print("saved ablation.json and figures/test_value_ablation.png")


if __name__ == "__main__":
    main()