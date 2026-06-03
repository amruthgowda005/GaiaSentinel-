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
- Awaiting Phase 5 prompt from user.

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
