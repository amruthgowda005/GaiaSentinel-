# Gaia Sentinel Project Context

## Phase 1
**Tech Stack Decisions:**
- **Frontend:** React Native (Expo) - chosen for rapid cross-platform development (Web/Mobile) and ease of UI styling.
- **Backend:** FastAPI (Python) - chosen for speed, automatic documentation, and seamless integration with upcoming Scikit-learn ML models.
- **Map:** Placeholder component prepared (will integrate Leaflet/react-native-maps in future phases).

**Folder Structure:**
- `/frontend`: Contains the Expo React Native application.
- `/backend`: Contains the FastAPI application.
- `requirements.txt`: Python dependencies.

**Components Created:**
- **Backend:** `/health` endpoint in `backend/main.py`.
- **Frontend:** Bottom Tab Navigation (Home, Modules, Profile). Home screen with map placeholder and styled eco-themed cards (Plant, Air, Soil, Water).

**Known Issues:**
- Map is currently a static placeholder as requested.
- Frontend navigation assumes basic routing for Phase 1.

**Next Phase Plan:**
- Awaiting Phase 10 prompt from user.

## Phase 9
**Goal:** Persistent storage of environmental scan data with a History Timeline UI.

**Database:** SQLite (via `aiosqlite`) — zero-config, file-based, runs locally at `gaia_sentinel.db`

**DB Schema:**
```sql
CREATE TABLE IF NOT EXISTS scans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp       TEXT NOT NULL,          -- ISO 8601 UTC
  latitude        REAL,                   -- GPS latitude
  longitude       REAL,                   -- GPS longitude
  aqi             INTEGER,                -- Air Quality Index value
  aqi_status      TEXT,                   -- Good | Moderate | Poor
  water_score     INTEGER,                -- 0-100 composite water health
  water_status    TEXT,                   -- Pristine | Marginal | Contaminated
  water_ph        REAL,                   -- pH reading (6.0 - 9.0)
  turbidity       REAL,                   -- NTU reading
  insights_count  INTEGER DEFAULT 0       -- # of AI insights generated
);
```

**Storage Logic:**
- Every `fetchAggregate()` call in `_layout.tsx` auto-saves a scan record after collecting air + water + insight data
- `POST /scan/save` — inserts a new scan row with all metrics
- `GET /scan/history?limit=N` — returns last N scans ordered by newest first
- `DELETE /scan/history` — clears all records (accessible from History sidebar controls)

**APIs:**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/scan/save` | Save a new scan record |
| GET | `/scan/history` | Retrieve scan history (default: 20) |
| DELETE | `/scan/history` | Clear all history |

**Frontend (History Module):**
- Stats row: Total Scans, Critical count, Latest AQI
- Vertical timeline with color-coded dots (cyan=Good, orange=Moderate, red=Poor)
- Per-scan card: date/time, coordinates, AQI bar, Water bar, pH bar, AI insight count badge
- Pull-to-refresh support
- Auto-loads when History tab is selected


## Phase 8
**APIs Created:**
- `POST /insights` — Rule engine that evaluates all environmental metrics and returns prioritised AI alerts.

**Rules Implemented:**

| Metric | Warning Threshold | Critical Threshold |
|---|---|---|
| AQI | > 50 | > 100 |
| Water Score | < 80 | < 50 |
| Turbidity | > 5 NTU | — |
| Water pH | < 6.5 or > 8.5 | — |
| PHI Score | < 70 | < 40 |
| Soil Score | < 85 | < 50 |

**Frontend:**
- Insight cards rendered below each module's result card (filtered by module).
- Alert badge in the top HUD shows real-time critical count.
- Insights auto-trigger after every planetary scan via the sidebar.

## Phase 7
**APIs Created:**
- `GET /aggregate?lat=...&lon=...` (Backend) - Unified endpoint to fetch Air, Water, Plant, and Soil data concurrently for a specific geolocation.

**Map Architecture:**
- React Native absolute positioning over a 3D Earth Mock layer.
- `plants`: Plotted dynamically using coordinate offset logic, rendered as colored dots based on health.
- `soils`: Rendered as colored squares.
- `air`: Renders a global heatmap tint over the globe based on Air Quality Index.

**Layer Logic:**
- Interactive React Native `Switch` components bound to localized React state (`layers`).
- Conditional rendering on the Tactical Overlays based on active toggles (AirTrace, RiverPulse, PlantTalk, SoilSense).

## Phase 6
**APIs Created:**
- `GET /water/quality?lat=...&lon=...` (Backend) - Generates water quality telemetry.

**Data Source:**
- Mock Hydro Sensor Network (Simulated based on geolocation)

**Metrics Used:**
- `pH`: 6.0 - 9.0 (Ideal: 6.5 - 8.5)
- `Turbidity (NTU)`: Clarity of water (Ideal: < 5.0)
- `Dissolved Oxygen (mg/L)`: Oxygen level for aquatic life (Ideal: > 6.0)

**UI Component:**
- **RIVERPULSE MODULE**: Added to the Sci-Fi dashboard right-side telemetry panel, automatically triggered when geolocation is established. Displays score, status (Pristine, Marginal, Contaminated), and raw metrics.

## Phase 5
**APIs Created:**
- `POST /soil/analyze` (Backend) - Calculates soil health score based on pH and Moisture.

**Inputs Supported:**
- `ph`: float (Ideal: 6.5 - 7.5)
- `moisture`: float % (Ideal: 30% - 60%)
- `soil_type`: string

**Soil Scoring Formula:**
- Base score: 100
- Severe pH penalty (-30) for <5.5 or >8.5
- Mild pH penalty (-10) for <6.0 or >8.0
- Severe Moisture penalty (-30) for <20% or >80%
- Mild Moisture penalty (-10) for <30% or >70%
- Result maps to Optimal, Fair, or Critical.

## Phase 4
**APIs Created:**
- `GET /air/aqi?lat=...&lon=...` (Backend) - Fetches realtime European AQI.

**API Used:**
- `Open-Meteo Air Quality API` (https://open-meteo.com/en/docs/air-quality-api)

**AQI Scale Mapping:**
- `Good`: 0-50
- `Moderate`: 51-100
- `Poor`: > 100

**Rate Limits & Constraints:**
- Open-Meteo is free for non-commercial use with a 10,000 API calls per day limit.
- If the external API fails, a resilient Mock Fallback is implemented returning a default 50 AQI.

## Phase 2
**APIs Created:**
- `POST /upload` (Backend) - Accepts multipart/form-data for image uploads with location metadata.

**Data Schema (Metadata):**
- `latitude`: string (from device GPS)
- `longitude`: string (from device GPS)
- `timestamp`: string (ISO 8601 format)

**Permissions Required:**
- `Camera`: For capturing environmental images.
- `Location (Foreground)`: For geolocating the captured data.

**Issues Encountered:**
- Web testing of Camera/Location in Expo requires secure context (HTTPS) or localhost.
- Android emulator may require mocked location settings.

## Phase 3
**APIs Created:**
- `POST /plant/analyze` (Backend) - Accepts an image file and returns a mocked Plant Health Index.

**Model / API Used:**
- Currently using a **Mock Model** inside FastAPI that generates random PHI scores. Will integrate a Scikit-Learn or TensorFlow model in later phases.

**Input/Output Format:**
- Input: `multipart/form-data` containing an image file.
- Output: JSON `{ "phi_score": integer, "status": string, "filename": string, "message": string }`

**PHI Calculation Logic:**
- Random integer between 30 and 100.
- `Healthy`: 80-100
- `Moderate`: 50-79
- `Critical`: 30-49
