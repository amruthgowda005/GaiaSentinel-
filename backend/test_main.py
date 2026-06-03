from fastapi.testclient import TestClient
import os
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_plant_analyze():
    # Create a dummy image file for testing
    test_filename = "test_image.jpg"
    with open(test_filename, "wb") as f:
        f.write(b"mock image content")
        
    # Send test request
    with open(test_filename, "rb") as f:
        response = client.post("/plant/analyze", files={"file": (test_filename, f, "image/jpeg")})
    
    # Cleanup
    os.remove(test_filename)
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert "phi_score" in data
    assert "status" in data
    assert 30 <= data["phi_score"] <= 100
    assert data["status"] in ["Healthy", "Moderate", "Critical"]
