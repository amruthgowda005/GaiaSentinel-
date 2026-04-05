import random
import io
import datetime
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np

app = FastAPI(title="GaiaSentinel API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global historical data (mock)
# Normally this would be a DB or sensor buffer
AIR_HISTORY = []

def generate_mock_history():
    history = []
    now = datetime.datetime.now()
    for i in range(24):
        time = (now - datetime.timedelta(hours=24-i)).strftime("%H:00")
        aqi = random.randint(30, 160)
        history.append({"time": time, "aqi": aqi})
    return history

AIR_HISTORY = generate_mock_history()

@app.get("/api/air")
async def get_air_quality():
    """Returns current AQI and 24-hour historical data."""
    current_aqi = random.randint(20, 180)
    
    if current_aqi <= 50:
        category = "Good"
        color = "#22d3a5" # Green
    elif current_aqi <= 100:
        category = "Moderate"
        color = "#fbbf24" # Amber
    else:
        category = "Poor"
        color = "#f87171" # Red
        
    return {
        "aqi": current_aqi,
        "category": category,
        "color": color,
        "history": AIR_HISTORY,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/air/predict")
async def predict_air():
    """Predicts next-hour AQI using a moving average of the last 5 points."""
    last_5 = [h["aqi"] for h in AIR_HISTORY[-5:]]
    trend = sum(last_5) / len(last_5)
    # Add a small random jitter for "realism"
    prediction = int(trend + random.randint(-5, 5))
    
    if prediction <= 50: category = "Good"
    elif prediction <= 100: category = "Moderate"
    else: category = "Poor"
    
    return {
        "predicted_aqi": prediction,
        "category": category,
        "confidence": 0.85
    }

@app.post("/api/plant/analyze")
async def analyze_plant(image: UploadFile = File(...)):
    """Vision analysis for PHI and inferred stress reasoning."""
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img_data = np.array(img)
    
    pixels = img_data.reshape(-1, 3)
    r, g, b = pixels[:, 0], pixels[:, 1], pixels[:, 2]
    
    green_mask = (g > r) & (g > b)
    brown_mask = (r > g) & (g > b)
    
    green_count = np.sum(green_mask)
    brown_count = np.sum(brown_mask)
    
    green_ratio = green_count / (green_count + brown_count + 1e-6)
    phi = int(green_ratio * 100)
    phi = max(20, min(98, phi))
    
    # Reasoning logic
    causes = []
    if phi < 80:
        # Check brightness/saturation for stress types
        avg_r = np.mean(r[brown_mask]) if brown_count > 0 else 0
        if avg_r > 150:
            causes.append("Heat Stress")
        else:
            causes.append("Water Stress")

    if phi >= 80:
        status = "Healthy"
        insight = "Optimal photosynthetic activity."
    elif phi >= 50:
        status = "Moderate"
        insight = f"Signs of stress detected. Primary cause: {', '.join(causes)}."
    else:
        status = "Stressed"
        insight = f"Critical decay level. Primary cause: {', '.join(causes)}."
        
    return {
        "phi": phi,
        "status": status,
        "insight": insight,
        "causes": causes,
        "timestamp": datetime.datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
