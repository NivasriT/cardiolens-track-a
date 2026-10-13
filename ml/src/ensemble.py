import itertools

import numpy as np
from xgboost import XGBClassifier

from ml.src.groups import OPTIONAL_GROUPS

N_BOOT = 20
LO_PCT, HI_PCT = 5, 95


def key_of(groups):
    g = sorted(set(groups) & set(OPTIONAL_GROUPS))
    return "base" if not g else "base+" + "+".join(g)


def all_subsets():
    for r in range(len(OPTIONAL_GROUPS) + 1):
        for combo in itertools.combinations(OPTIONAL_GROUPS, r):
            yield list(combo)


def fit_ensemble(X, y, cols, seed=0):
    """Train N_BOOT XGBoost models, each on a bootstrap resample of the patients."""
    rng = np.random.default_rng(seed)
    pos_weight = (y == 0).sum() / max((y == 1).sum(), 1)
    models = []
    while len(models) < N_BOOT:
        idx = rng.choice(len(X), size=len(X), replace=True)
        if y.iloc[idx].nunique() < 2:  # skip a sample that has only one class
            continue
        m = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, subsample=0.8,
                          colsample_bytree=0.8, scale_pos_weight=pos_weight,
                          eval_metric="logloss", random_state=int(rng.integers(10**9)))
        m.fit(X.iloc[idx][cols], y.iloc[idx])
        models.append(m)
    return models


def predict_batch(models, cols, df):
    """Returns an array of shape (n_models, n_patients) with the probability of each model."""
    return np.array([m.predict_proba(df[cols])[:, 1] for m in models])


def summarise(P):
    """Mean probability plus a 5th-95th percentile interval across the models."""
    p = P.mean(axis=0)
    lo = np.percentile(P, LO_PCT, axis=0)
    hi = np.percentile(P, HI_PCT, axis=0)
    return p, np.minimum(lo, p), np.maximum(hi, p)  # guarantees lo <= p <= hi


def confidence_label(width, thresholds):
    if width < thresholds["high_below"]:
        return "high"
    if width < thresholds["medium_below"]:
        return "medium"
    return "low"