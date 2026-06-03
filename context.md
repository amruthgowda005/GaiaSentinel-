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
- Awaiting Phase 2 prompt from user to expand functionality (e.g., integrating the ML pipeline or adding actual map functionality).
