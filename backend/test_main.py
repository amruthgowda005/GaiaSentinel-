from fastapi.testclient import TestClient
import os
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_plant_analyze():
    test_filename = "test_image.jpg"
    with open(test_filename, "wb") as f:
        f.write(b"mock image content")
    with open(test_filename, "rb") as f:
        response = client.post("/plant/analyze", files={"file": (test_filename, f, "image/jpeg")})
    os.remove(test_filename)
    assert response.status_code == 200
    data = response.json()
    assert "phi_score" in data
    assert "status" in data
    assert 30 <= data["phi_score"] <= 100
    assert data["status"] in ["Healthy", "Moderate", "Critical"]

def test_soil_analyze():
    response = client.post("/soil/analyze", json={"ph": 7.0, "moisture": 45.0, "soil_type": "Loam"})
    assert response.status_code == 200
    data = response.json()
    assert "soil_score" in data
    assert "status" in data
    assert data["status"] in ["Optimal", "Fair", "Critical"]

def test_soil_bad_ph():
    response = client.post("/soil/analyze", json={"ph": 3.0, "moisture": 50.0, "soil_type": "Clay"})
    assert response.status_code == 200
    assert response.json()["status"] in ["Fair", "Critical"]

def test_aqi_endpoint():
    response = client.get("/air/aqi?lat=12.97&lon=77.59")
    assert response.status_code == 200
    data = response.json()
    assert "aqi" in data
    assert "status" in data

def test_water_quality():
    response = client.get("/water/quality?lat=12.97&lon=77.59")
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "metrics" in data
    assert "ph" in data["metrics"]
    assert "turbidity_ntu" in data["metrics"]
    assert "do_mgl" in data["metrics"]

def test_aggregate():
    response = client.get("/aggregate?lat=12.97&lon=77.59")
    assert response.status_code == 200
    data = response.json()
    assert "air" in data
    assert "water" in data
    assert "map_markers" in data
    assert "soils" in data["map_markers"]

def test_admin_health():
    with TestClient(app) as client:
        response = client.get("/admin/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

def test_admin_logs():
    with TestClient(app) as client:
        response = client.get("/admin/logs")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data

def test_admin_test_module():
    with TestClient(app) as client:
        response = client.post("/admin/test/health")
        assert response.status_code == 200
        data = response.json()
        assert data["module"] == "health"
        assert data["status"] == "ok"

def test_naturegpt_query():
    with TestClient(app) as client:
        payload = {
            "query": "What is the AQI?",
            "context": {
                "aggregateData": {"air": {"aqi": 75, "status": "Moderate"}}
            }
        }
        response = client.post("/naturegpt/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "75" in data["response"]
        assert data["model"] == "NatureGPT-Mock-v1"
