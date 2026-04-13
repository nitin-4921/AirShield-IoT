# AirShield — IoT Air Quality Monitoring Dashboard

A real-time air quality monitoring system built with React, Node.js, and Firebase. Connects to a physical IoT sensor (gas, temperature, humidity) at GLA University Mathura, calculates AQI, runs ML-based 30-minute predictions, and displays everything in a neumorphic dashboard UI.

---

## Features

- **Live Sensor Dashboard** — Real-time AQI, temperature, humidity from IoT hardware via Firebase (GLA University only — no fake data shown when sensor is offline)
- **ML AQI Prediction** — 30-minute AQI forecast powered by a deployed ML model (`airsheild-ml.onrender.com`)
- **World AQI Ranking** — Top 10 most polluted cities globally, live from WAQI API, auto-refreshed every 30 seconds
- **Pollution News** — Live news feed filtered by air quality keywords via GNews API
- **Interactive Map** — Leaflet map with all sensor nodes; tap any marker to switch the Dashboard to that location
- **Smart Alerts** — Auto-generated on startup and on threshold crossings (AQI > 100, 200, 300); badge count on sidebar
- **Search Bar** — Search pages and locations; shows only name in dropdown, AQI shown only after selection
- **History View** — Real AQI history chart (1W / 1M / 1Y) with hover tooltips, stats, and CSV/JSON export
- **Support Page** — FAQ accordion + contact form that sends to email via mailto
- **Sensor Status** — Live/Offline/Connecting badge on Dashboard; other locations clearly marked as Static Data

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4 (neumorphic design system)
- Framer Motion (animations)
- React Leaflet (maps)
- Lucide React (icons)

**Backend**
- Node.js + Express
- Firebase Realtime Database (IoT sensor source)
- WAQI API (world city AQI rankings)
- GNews API (pollution news feed)
- OpenWeatherMap API (AQI history)
- AirShield ML API (30-min AQI prediction)
- node-cache (5-minute response caching)

**Hardware / IoT**
- Physical sensor pushing `{ humidity, smoke, temperature }` to Firebase Realtime Database every few seconds

---

## Project Structure

```
airshield/
├── backend/
│   ├── server.js          # Express API — all endpoints
│   ├── .env               # API keys (not committed)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx        # Entire app — views, state, logic
    │   ├── index.css      # Neumorphic design tokens
    │   └── main.jsx
    ├── .env               # VITE_API_URL for local dev
    ├── .env.production    # VITE_API_URL for production build
    └── package.json
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/airshield.git
cd airshield
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# Firebase Realtime Database (IoT sensor)
FIREBASE_URL=https://your-project-default-rtdb.firebaseio.com/.json

# WAQI API — https://aqicn.org/data-platform/token/
WAQI_TOKEN=your_waqi_token_here

# GNews API — https://gnews.io/
GNEWS_API_KEY=your_gnews_key_here

# OpenWeatherMap API — https://openweathermap.org/api
OWM_API_KEY=your_owm_key_here

# AirShield ML Model
AIRSHEILD_MODAL_API=https://airsheild-ml.onrender.com/predict
```

Start the backend:

```bash
node server.js
# Runs on http://localhost:3000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

`frontend/.env` is already configured for local dev:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
# Runs on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description | Cache |
|--------|----------|-------------|-------|
| GET | `/aqi` | Live IoT sensor data (AQI, temp, humidity, smoke) | None |
| GET | `/predict` | 30-min ML AQI prediction using live sensor inputs | None |
| GET | `/world-aqi` | Top 10 most polluted cities globally | 5 min |
| GET | `/news` | Latest pollution & air quality news articles | 5 min |
| GET | `/aqi-history?range=1W\|1M\|1Y` | Historical AQI data for GLA University location | 5 min |

### `/aqi` — Live sensor

```json
{
  "aqi": 87,
  "status": "Safe",
  "smoke": 42,
  "temperature": 28.5,
  "humidity": 27.0
}
```

### `/predict` — ML prediction

```json
{
  "predicted_aqi": 147,
  "status": "Moderate",
  "alert": false,
  "inputs": { "hour": 14, "temp": 28.5, "humidity": 27, "mq135": 42, "pm25": 50 },
  "predicted_at": "2026-04-13T10:00:00.000Z"
}
```

### `/world-aqi` — Global ranking

```json
{
  "cities": [
    { "rank": 1, "city": "Karachi", "country": "Pakistan", "countryCode": "pk", "aqi": 161, "status": "Unhealthy" }
  ],
  "lastUpdated": "2026-04-13T10:00:00.000Z"
}
```

### `/aqi-history` — Historical data

```json
{
  "points": [
    { "ts": 1775692800, "label": "Thu, Apr 9", "aqi": 175 }
  ],
  "range": "1W",
  "currentAqi": 62
}
```

---

## AQI Scale

| AQI Range | Status |
|-----------|--------|
| 0 – 50 | Good |
| 51 – 100 | Moderate |
| 101 – 150 | Unhealthy for Sensitive Groups |
| 151 – 200 | Unhealthy |
| 201 – 300 | Very Unhealthy |
| 301+ | Severe |

---

## Data Flow

```
IoT Sensor → Firebase Realtime DB → /aqi endpoint → Dashboard (GLA only)
                                  → /predict → ML Model → AQI IN 30M tile
WAQI API  → /world-aqi → World AQI page
GNews API → /news      → Pollution News page
OWM API   → /aqi-history → History page chart
```

---

## Location Logic

| Location | Data Source |
|----------|-------------|
| GLA University Mathura | Live IoT sensor via Firebase — shows `--` if offline |
| Dwarkadhish Temple | Static hardcoded data |
| Prem Mandir, Vrindavan | Static hardcoded data |
| Mathura Cantt | Static hardcoded data |

Switch locations via the **Map Overview** (tap marker → "View on Dashboard") or the **search bar**.

---

## Deployment

### Backend (Render / Railway / etc.)
Set all environment variables from `backend/.env` in your platform's dashboard. Never commit `.env`.

### Frontend (Vercel / Netlify / etc.)
Before building, set:
```env
VITE_API_URL=https://your-deployed-backend.com
```
Then build:
```bash
cd frontend && npm run build
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `FIREBASE_URL` | backend | Firebase Realtime DB URL (IoT data source) |
| `WAQI_TOKEN` | backend | WAQI API token for world AQI rankings |
| `GNEWS_API_KEY` | backend | GNews API key for pollution news |
| `OWM_API_KEY` | backend | OpenWeatherMap key for AQI history |
| `AIRSHEILD_MODAL_API` | backend | ML model prediction endpoint URL |
| `VITE_API_URL` | frontend | Backend base URL (localhost in dev, deployed URL in prod) |

---

## Auto-Refresh Intervals

| Data | Interval |
|------|----------|
| Live sensor (IoT) | 30 seconds |
| ML prediction | 30 seconds |
| World AQI ranking | 5 minutes (cached) |
| Pollution news | 5 minutes (cached) |
| AQI history | On tab switch (cached 5 min) |

---

## License

MIT
