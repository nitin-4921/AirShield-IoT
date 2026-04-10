const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const FIREBASE_URL = 'https://airsheild-default-rtdb.firebaseio.com/.json';

app.get('/aqi', async (req, res) => {
    try {
        const response = await axios.get(FIREBASE_URL);
        const fbData = response.data;
        
        if (!fbData) {
            return res.status(404).json({ error: "No data available in Firebase" });
        }
        
        // Handle if data is nested under "sensor"
        const data = fbData.sensor || fbData;

        const smoke = parseFloat(data.smoke) || 0;
        const temperature = parseFloat(data.temperature) || 0;
        const humidity = parseFloat(data.humidity) || 0;

        // AQI Calculation based on user formula: AQI = ((smoke - 50) / (300 - 50)) * 500
        let calculated_aqi;
        if (smoke < 50) {
            // Guarantee valid safe scaling 0-100 for smoke 0-50
            calculated_aqi = (smoke / 50) * 100;
        } else {
            calculated_aqi = ((smoke - 50) / 250) * 500;
        }
        
        let aqi = Math.max(0, Math.round(calculated_aqi));

        // Status classification
        let status = "Safe";
        if (aqi <= 100) {
            status = "Safe";
        } else if (aqi <= 200) {
            status = "Moderate";
        } else if (aqi <= 300) {
            status = "Unhealthy";
        } else {
            status = "Dangerous";
        }

        res.json({
            aqi,
            status,
            smoke,
            temperature,
            humidity
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data from Firebase" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
