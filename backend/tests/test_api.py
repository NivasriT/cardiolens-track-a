from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
	response = client.get("/health")
	assert response.status_code == 200
	assert response.json() == {"status": "ok"}

def test_predict_shape():
	response = client.post("/predict", json={"patient": {"Age": 60}, "available_groups": []})
	assert response.status_code == 200
	body = response.json()
	for key in ["cad", "vessels", "explanations", "disclaimer"]:
		assert key in body
	assert set(body["vessels"].keys()) == {"LAD", "LCX", "RCA"}
