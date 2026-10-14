import time

import joblib
import numpy as np
import pandas as pd

from ml.src.data import ROOT, load_all
from ml.src.ensemble import all_subsets, fit_ensemble, key_of, predict_batch, summarise
from ml.src.groups import GROUP_OF, columns_for

MODELS = ROOT / "ml" / "models"
MODELS.mkdir(parents=True, exist_ok=True)


def main():
    X, Y = load_all()
    X = X.reset_index(drop=True)
    Y = {t: y.reset_index(drop=True) for t, y in Y.items()}
    columns = list(X.columns)

    unknown = [c for c in columns if c not in GROUP_OF]
    assert not unknown, f"These columns are missing from GROUP_OF in groups.py: {unknown}"

    medians = X.median(numeric_only=True).fillna(0.0)
    Xf = X.fillna(medians)  # same "typical value" filling that inference uses

    bundle = {}
    t0 = time.time()
    for groups in all_subsets():
        key = key_of(groups)
        cols = columns_for(groups, columns)
        bundle[key] = {}
        for t, y in Y.items():
            models = fit_ensemble(Xf, y, cols, seed=42)
            bundle[key][t] = {"cols": cols, "models": models}
        print(f"trained {key:<22} ({len(cols)} inputs)  {time.time() - t0:5.0f}s")

    # Confidence thresholds from the real distribution of interval widths
    # (tertiles over all patients, all 8 test combinations and all 4 targets,
    # so that high, medium and low all appear).
    all_widths, mean_width_cad = [], {}
    for key, per_target in bundle.items():
        for t, e in per_target.items():
            _, lo, hi = summarise(predict_batch(e["models"], e["cols"], Xf))
            all_widths.append(hi - lo)
            if t == "CAD":
                mean_width_cad[key] = float((hi - lo).mean())
    pooled = np.concatenate(all_widths)
    thresholds = {"high_below": float(np.percentile(pooled, 33.3)),
                  "medium_below": float(np.percentile(pooled, 66.7))}

    meta = {"columns": columns, "medians": {c: float(v) for c, v in medians.items()},
            "train_X": Xf, "conf_thresholds": thresholds}
    path = MODELS / "groups.joblib"
    joblib.dump({"models": bundle, "meta": meta}, path, compress=3)

    size_mb = path.stat().st_size / 1e6
    print("\nMean CAD interval width per test combination (smaller = more certain):")
    for k, v in sorted(mean_width_cad.items(), key=lambda kv: -kv[1]):
        print(f"  {k:<22} {v:.3f}")
    print("confidence thresholds:", {k: round(v, 3) for k, v in thresholds.items()})
    print(f"saved {path.name}: {size_mb:.1f} MB", "(OK, under 60 MB)" if size_mb < 60 else "(TOO BIG)")


if __name__ == "__main__":
    main()