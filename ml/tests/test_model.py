import json

import pytest

from ml.src.data import ROOT, load_all
from ml.src.inference import RiskModel

TARGETS = ["CAD", "LAD", "LCX", "RCA"]
ALL = ["ecg", "labs", "echo"]


@pytest.fixture(scope="module")
def model():
    return RiskModel()


@pytest.fixture(scope="module")
def patients():
    return json.load(open(ROOT / "ml" / "reports" / "sample_patients.json"))


def test_no_target_column_in_inputs():
    X, _ = load_all()
    assert not {"Cath", "LAD", "LCX", "RCA"} & set(X.columns)


@pytest.mark.parametrize("groups", [[], ["ecg"], ALL])
def test_probabilities_and_interval(model, patients, groups):
    for pt in patients:
        res = model.predict(pt["inputs"], groups)
        for t in TARGETS:
            r = res[t]
            assert 0 <= r["lo"] <= r["p"] <= r["hi"] <= 1
            assert r["confidence"] in {"high", "medium", "low"}


def test_base_only_with_missing_inputs(model):
    r = model.predict({"Age": 60}, [])
    assert set(r) == set(TARGETS)


def test_next_best_test(model, patients):
    assert model.next_best_test(patients[0]["inputs"], ALL) is None
    out = model.next_best_test(patients[0]["inputs"], [])
    assert len(out["ranking"]) == 3 and out["recommended_group"] in ALL