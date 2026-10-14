FRIENDLY_NAMES = {
	"Age": "age",
	"HTN": "hypertension",
	"DM": "diabetes",
	"EF-TTE": "ejection fraction",
	"BP": "blood pressure",
	"PR": "pulse rate",
	"St Depression": "ST depression",
	"TInversion": "T-wave inversion",
}

def format_sentence(feature, value, shap):
	name = FRIENDLY_NAMES.get(feature, feature.lower())
	direction = "increases" if shap > 0 else "decreases"
	return {
		"feature": feature,
		"value": value,
		"shap": round(shap, 3),
		"direction": direction,
		"sentence": f"{feature} ({value}) {direction} the predicted risk."
	}

def build_explanation(shap_list):
	if not shap_list:
		return {"summary": "No significant factors recorded.", "top_factors": []}
	top_factors = [format_sentence(f["feature"], f["value"], f["shap"]) for f in shap_list]
	pos = [f["feature"] for f in shap_list if f["shap"] > 0][:2]
	neg = [f["feature"] for f in shap_list if f["shap"] < 0][:1]
	summary_parts = []
	if pos:
		summary_parts.append(f"{', '.join(pos)} elevated predicted risk")
	if neg:
		summary_parts.append(f"{', '.join(neg)} lowered risk")
	summary = "; ".join(summary_parts).capitalize() + "." if summary_parts else "Balanced risk factors."
	return {
		"summary": summary,
		"top_factors": top_factors
	}
