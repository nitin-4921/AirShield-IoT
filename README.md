# AirShield — IoT Air Quality Monitoring Dashboard

A real-time air quality monitoring system built with React, Node.js, and Firebase. Connects to a physical IoT sensor that reads temperature, humidity, and smoke/gas levels, calculates AQI, and displays everything in a neumorphic dashboard UI.

---

## Features

- **Live Sensor Dashboard** — Real-time AQI, temperature, humidity from IoT hardware via Firebase
- **World AQI Ranking** — Top 10 most polluted cities globally, updated every 5 minutes via WAQI API
- **Pollution News** — Live news feed filtered by air quality keywords via GNews API
- **Interactive Map** — Leaflet map with sensor node locations and AQI markers
- **Smart Alerts** — Auto-generated alerts when AQI crosses thresholds (100, 200, 300)
- **Working Search** — Search pages and sensor locations from the header
- **History View** — AQI trend visualization and data export
- **Support Page** — FAQ accordion + contact form (mailto)

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
- Firebase Realtime Database (IoT sensor data)
- WAQI API (world city AQI rankings)
- GNews API (pollution news feed)
- node-cache (5-minute API response caching)

**Hardware**
- IoT sensor pushing `{ humidity, smoke, temperature }` to Firebase Realtime Database

---

## Project Structure

```
airshield/
├── backend/
│   ├── server.js        # Express API server
│   ├── .env             # API keys (not committed)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx      # Main app + all views
    │   ├── index.css    # Neumorphic design tokens
    │   └── main.jsx
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

Create a `.env` file:

```env
WAQI_TOKEN=your_waqi_token_here
GNEWS_API_KEY=your_gnews_key_here
```

Get your free API keys:
- WAQI token: https://aqicn.org/data-platform/token/
- GNews key: https://gnews.io/

Start the backend:

```bash
node server.js
# Server runs on http://localhost:3000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/aqi` | Live sensor data from Firebase (AQI, temp, humidity, smoke) |
| GET | `/world-aqi` | Top 10 most polluted cities globally (cached 5 min) |
| GET | `/news` | Latest pollution & air quality news (cached 5 min) |
| POST | `/predict` | Future AQI prediction (next 30 min) using ML model |

### Sample Response — `/aqi`

```json
{
  "aqi": 87,
  "status": "Safe",
  "smoke": 42,
  "temperature": 28.5,
  "humidity": 27.0
}
```

### Sample Response — `/world-aqi`

```json
{
  "cities": [
    {
      "rank": 1,
      "city": "Karachi",
      "country": "Pakistan",
      "countryCode": "pk",
      "aqi": 161,
      "status": "Unhealthy",
      "dominentpol": "pm25"
    }
  ],
  "lastUpdated": "2026-04-10T17:00:26.126Z"
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

## Firebase Setup

The IoT sensor pushes data to Firebase Realtime Database in this format:

```json
{
  "humidity": 27.0,
  "smoke": 0,
  "temperature": 28.5
}
```

Update the Firebase URL in `backend/server.js` to point to your own database:

```js
const FIREBASE_URL = 'https://your-project-default-rtdb.firebaseio.com/.json';
```

---

## Machine Learning Integration

AirShield features a predictive intelligence layer that forecasts air quality 30 minutes into the future.

### Architecture
- **Model Hosting**: The machine learning model is hosted on a separate specialized inference server (`https://airsheild-ml.onrender.com/predict`).
- **Data Flow**:
  1. Frontend fetches live sensor data from Backend (`/aqi`).
  2. Frontend sends live metrics (`temp`, `humidity`, `mq135`, `pm25`) to Backend (`/predict`).
  3. Backend calculates the **target time** (currentTime + 30 mins) and extracts the hour.
  4. Backend forwards all features to the ML Model.
  5. The ML Model returns the predicted AQI and status.
  6. Frontend displays the prediction in the **"AQI IN 30M"** dashboard card.

### Predict Feature Vector
The model uses 5 input features for prediction:
- `hour`: The target hour of the day (e.g., if it's 4:15 PM, it predicts for the 16th hour).
- `temp`: Ambient temperature.
- `humidity`: Relative humidity percentage.
- `mq135`: Gas sensor concentration (smoke/CO/benzene).
- `pm25`: Fine particulate matter concentration.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WAQI_TOKEN` | WAQI API token for world city AQI data |
| `GNEWS_API_KEY` | GNews API key for pollution news feed |
| `OWM_API_KEY` | OpenWeatherMap API key - get free key at https://openweathermap.org/api |
| `AIRSHEILD_MODAL_API` | Endpoint URL for the ML Prediction Model |

Never commit your `.env` file. It is already listed in `.gitignore`.

---

## License

MIT
