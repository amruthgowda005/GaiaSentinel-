import os
import random
import httpx
import aiosqlite
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiofiles

DB_PATH = "gaia_sentinel.db"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                aqi INTEGER,
                aqi_status TEXT,
                water_score INTEGER,
                water_status TEXT,
                water_ph REAL,
                turbidity REAL,
                insights_count INTEGER DEFAULT 0
            )
        """)
        await db.commit()
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title="Gaia Sentinel API", version="1.0.0", lifespan=lifespan)

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

class SoilData(BaseModel):
    ph: float
    moisture: float
    soil_type: str

@app.post("/soil/analyze")
async def analyze_soil(data: SoilData):
    score = 100
    
    # pH penalty (Ideal: 6.5 - 7.5)
    if data.ph < 5.5 or data.ph > 8.5:
        score -= 30
    elif data.ph < 6.0 or data.ph > 8.0:
        score -= 10
        
    # Moisture penalty (Ideal: 30 - 60%)
    if data.moisture < 20 or data.moisture > 80:
        score -= 30
    elif data.moisture < 30 or data.moisture > 70:
        score -= 10

    status = "Optimal"
    if score < 50: 
        status = "Critical"
    elif score < 85: 
        status = "Fair"
        
    return {
        "soil_score": max(0, score),
        "status": status,
        "recommendation": "Adjust pH buffers" if data.ph < 6 else "Maintain current irrigation"
    }

@app.get("/water/quality")
async def get_water_quality(lat: float, lon: float):
    # Mock hydro-sensor data for the area
    ph = round(random.uniform(6.0, 9.0), 1)
    turbidity = round(random.uniform(1.0, 12.0), 1) # NTU
    dissolved_oxygen = round(random.uniform(4.0, 10.0), 1) # mg/L

    score = 100
    if ph < 6.5 or ph > 8.5: score -= 20
    if turbidity > 5.0: score -= 20
    if dissolved_oxygen < 6.0: score -= 30

    status = "Pristine"
    if score < 50: status = "Contaminated"
    elif score < 80: status = "Marginal"

    return {
        "score": max(0, score),
        "status": status,
        "metrics": {
            "ph": ph,
            "turbidity_ntu": turbidity,
            "do_mgl": dissolved_oxygen
        },
        "source": "Mock Hydro Sensor Network"
    }

@app.get("/aggregate")
async def get_aggregate_data(lat: float, lon: float):
    water = await get_water_quality(lat, lon)
    air = await get_aqi(lat, lon)
    
    # Generate mock map markers for the tactical UI
    plants = [
        {"id": 1, "lat": lat + random.uniform(-0.05, 0.05), "lon": lon + random.uniform(-0.05, 0.05), "status": "Healthy"},
        {"id": 2, "lat": lat + random.uniform(-0.05, 0.05), "lon": lon + random.uniform(-0.05, 0.05), "status": "Moderate"},
        {"id": 3, "lat": lat + random.uniform(-0.05, 0.05), "lon": lon + random.uniform(-0.05, 0.05), "status": "Critical"}
    ]
    
    soils = [
        {"id": 1, "lat": lat + random.uniform(-0.05, 0.05), "lon": lon + random.uniform(-0.05, 0.05), "score": random.randint(40, 100)},
        {"id": 2, "lat": lat + random.uniform(-0.05, 0.05), "lon": lon + random.uniform(-0.05, 0.05), "score": random.randint(40, 100)}
    ]
    
    return {
        "air": air,
        "water": water,
        "map_markers": {
            "plants": plants,
            "soils": soils
        }
    }

class InsightRequest(BaseModel):
    aqi: float = 50
    water_score: float = 80
    phi_score: float = 75
    soil_score: float = 80
    water_ph: float = 7.0
    turbidity: float = 3.0

@app.post("/insights")
async def get_insights(data: InsightRequest):
    alerts = []

    # AQI Rules
    if data.aqi > 100:
        alerts.append({"id": "aqi_critical", "level": "critical", "module": "AirTrace",
            "title": "Hazardous Air Quality", "message": f"AQI {data.aqi} exceeds safe limit (100). Avoid outdoor activity."})
    elif data.aqi > 50:
        alerts.append({"id": "aqi_warning", "level": "warning", "module": "AirTrace",
            "title": "Moderate Air Quality", "message": f"AQI {data.aqi} is elevated. Sensitive groups should take precautions."})
    else:
        alerts.append({"id": "aqi_ok", "level": "info", "module": "AirTrace",
            "title": "Air Quality Good", "message": f"AQI {data.aqi} is within healthy range."})

    # Water Rules
    if data.water_score < 50:
        alerts.append({"id": "water_critical", "level": "critical", "module": "RiverPulse",
            "title": "Water Contamination Alert", "message": "Water health score critically low. Do not use for consumption."})
    elif data.water_score < 80:
        alerts.append({"id": "water_warning", "level": "warning", "module": "RiverPulse",
            "title": "Marginal Water Quality", "message": "Water quality is below optimal. Treatment recommended."})
    if data.turbidity > 5:
        alerts.append({"id": "turbidity", "level": "warning", "module": "RiverPulse",
            "title": "High Turbidity Detected", "message": f"Turbidity {data.turbidity} NTU exceeds safe threshold (5 NTU)."})
    if data.water_ph < 6.5 or data.water_ph > 8.5:
        alerts.append({"id": "water_ph", "level": "warning", "module": "RiverPulse",
            "title": "Water pH Imbalance", "message": f"pH {data.water_ph} is outside safe range (6.5–8.5)."})

    # Plant Rules
    if data.phi_score < 40:
        alerts.append({"id": "phi_critical", "level": "critical", "module": "PlantTalk",
            "title": "Plant Health Critical", "message": f"PHI score {data.phi_score} indicates severe plant stress. Immediate intervention needed."})
    elif data.phi_score < 70:
        alerts.append({"id": "phi_warning", "level": "warning", "module": "PlantTalk",
            "title": "Moderate Plant Stress", "message": f"PHI score {data.phi_score}. Monitor irrigation and nutrient levels."})

    # Soil Rules
    if data.soil_score < 50:
        alerts.append({"id": "soil_critical", "level": "critical", "module": "SoilSense",
            "title": "Soil Critically Degraded", "message": "Soil health is critical. Apply remediation treatment immediately."})
    elif data.soil_score < 85:
        alerts.append({"id": "soil_warning", "level": "warning", "module": "SoilSense",
            "title": "Soil Health Fair", "message": "Soil quality is below optimal. Consider pH buffering and organic matter addition."})

    return {"insights": alerts, "total": len(alerts)}

# ── Phase 9: Scan History CRUD ────────────────────────────────────────────────
class ScanRecord(BaseModel):
    latitude: float
    longitude: float
    aqi: int = 0
    aqi_status: str = "Unknown"
    water_score: int = 0
    water_status: str = "Unknown"
    water_ph: float = 7.0
    turbidity: float = 0.0
    insights_count: int = 0

@app.post("/scan/save")
async def save_scan(record: ScanRecord):
    ts = datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            INSERT INTO scans (timestamp, latitude, longitude, aqi, aqi_status,
                water_score, water_status, water_ph, turbidity, insights_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ts, record.latitude, record.longitude, record.aqi, record.aqi_status,
              record.water_score, record.water_status, record.water_ph,
              record.turbidity, record.insights_count))
        await db.commit()
        return {"id": cursor.lastrowid, "timestamp": ts, "message": "Scan saved"}

@app.get("/scan/history")
async def get_history(limit: int = 20):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return {"history": [dict(r) for r in rows], "total": len(rows)}

@app.delete("/scan/history")
async def clear_history():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM scans")
        await db.commit()
    return {"message": "History cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
