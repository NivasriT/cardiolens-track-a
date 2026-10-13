import json
import time

from ml.src.data import ROOT
from ml.src.inference import RiskModel

patients = json.load(open(ROOT / "ml" / "reports" / "sample_patients.json"))
model = RiskModel()
ALL = ["ecg", "labs", "echo"]

print(f"{'patient':<28}{'groups':<12}{'CAD p':>7}{'lo':>7}{'hi':>7}  confidence")
for pt in patients:
    for label, g in [("base", []), ("all", ALL)]:
        r = model.predict(pt["inputs"], g)["CAD"]
        print(f"{pt['label'] + ' (' + pt['scenario'] + ')':<28}{label:<12}{r['p']:>7.2f}{r['lo']:>7.2f}{r['hi']:>7.2f}  {r['confidence']}")

p = patients[0]["inputs"]
t0 = time.time()
nbt = model.next_best_test(p, [])
print("\nnext_best_test (base only):", json.dumps(nbt, indent=1))
print(f"took {time.time() - t0:.2f}s")
print("all groups ->", model.next_best_test(p, ALL))
print("explain CAD:", [(e['feature'], round(e['shap'], 2)) for e in model.explain(p, ALL, "CAD")])