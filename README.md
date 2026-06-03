# Gaia Sentinel

An intelligent full-stack environmental monitoring and analysis application.

## Project Structure
- **/backend**: FastAPI based backend for serving data and models.
- **/frontend**: React Native (Expo) frontend for a cross-platform eco-themed UI.

## Setup Instructions

### Backend
1. Activate virtual environment: `.\venv\Scripts\activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Run server: `cd backend && uvicorn main:app --reload`

### Frontend
1. Navigate to frontend: `cd frontend`
2. Install packages (if not done): `npm install`
3. Start Expo server: `npm run web` (or `npm start` for mobile testing)
