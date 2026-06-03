import os
import random
import httpx
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import aiofiles

app = FastAPI(title="Gaia Sentinel API", version="1.0.0")

# Allow CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Gaia Sentinel Backend"}

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    latitude: str = Form(None),
    longitude: str = Form(None),
    timestamp: str = Form(None)
):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    async with aiofiles.open(file_location, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    return {
        "message": "Upload successful",
        "filename": file.filename,
        "metadata": {
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": timestamp or datetime.utcnow().isoformat()
        }
    }

@app.post("/plant/analyze")
async def analyze_plant(file: UploadFile = File(...)):
    # Mock model for Phase 3
    # Simulates Plant Health Index (PHI)
    phi_score = random.randint(30, 100)
    if phi_score >= 80:
        status = "Healthy"
    elif phi_score >= 50:
        status = "Moderate"
    else:
        status = "Critical"
        
    return {
        "phi_score": phi_score,
        "status": status,
        "filename": file.filename,
        "message": "Analysis complete"
    }

@app.get("/air/aqi")
async def get_aqi(lat: float, lon: float):
    # Free Open-Meteo Air Quality API
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=european_aqi"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            data = response.json()
            aqi = data.get("current", {}).get("european_aqi", 45) # default 45 if missing
            
            status = "Good"
            if aqi > 100: status = "Poor"
            elif aqi > 50: status = "Moderate"
            
            return {"aqi": aqi, "status": status, "provider": "Open-Meteo"}
        except Exception:
            return {"aqi": 50, "status": "Good", "provider": "Mock Fallback"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
