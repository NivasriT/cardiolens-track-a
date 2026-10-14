import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.schemas import PredictRequest
from backend.app.explain_text import build_explanation

app = FastAPI(title="CardioLens API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parents[2]
DISCLAIMER = "For decision support and educational use only. Not a substitute for formal diagnostic imaging or clinical judgement."

@app.get("/health")
def health():
	return {"status": "ok"}

@app.get("/feature-schema")
def feature_schema():
	schema_path = ROOT / "ml" / "feature_schema.json"
	if schema_path.exists():
		return json.load(open(schema_path))
	return {"status": "not found"}

@app.get("/sample-patients")
def sample_patients():
	sample_path = ROOT / "ml" / "reports" / "sample_patients.json"
	if schema_path.exists():
		return json.load(open(sample_path))
	return []

@app.get("/metrics")
def metrics():
	metrics_path = ROOT / "ml" / "reports" / "metrics.json"
	if metrics_path.exists():
		return json.load(open(metrics_path))
	return {"status": "not ready"}

@app.get("/ablation")
def ablation():
	ablation_path = ROOT / "ml" / "reports" / "ablation.json"
	if ablation_path.exists():
		return json.load(open(ablation_path))
	return {"status": "not ready"}

@app.post("/predict")
def predict(req: PredictRequest):
	try:
		from ml.src.inference import RiskModel
		model = RiskModel()
		groups = req.available_groups
		preds = model.predict(req.patient, groups)

		def format_card(t):
			v = preds.get(t, {"p": 0.0, "lo": 0.0, "hi": 0.0, "confidence": "low"})
			return {
				"probability": v["p"],
				"ci_low": v["lo"],
				"ci_high": v["hi"],
				"confidence": v.get("confidence", "medium")
			}

		cad = format_card("CAD")
		cad["label"] = "CAD likely" if cad["probability"] >= 0.5 else "CAD less likely"

		explanations = {}
		for t in ["CAD", "LAD", "LCX", "RCA"]:
			raw_exp = model.explain(req.patient, groups, t)
			parsed = build_explanation(raw_exp)
			parsed["raw"] = raw_exp
			explanations[t] = parsed

		return {
			"cad": cad,
			"vessels": {t: format_card(t) for t in ["LAD", "LCX", "RCA"]},
			"groups_used": ["base"] + groups,
			"explanations": explanations,
			"next_best_test": model.next_best_test(req.patient, groups),
			"vitals": {k: req.patient[k] for k in ["BP", "PR", "BMI"] if k in req.patient},
			"disclaimer": DISCLAIMER
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))
