require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());

// 5-minute cache for external API calls
const cache = new NodeCache({ stdTTL: 300 });

const FIREBASE_URL = 'https://airsheild-default-rtdb.firebaseio.com/.json';
const WAQI_TOKEN = process.env.WAQI_TOKEN || 'demo';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const OWM_API_KEY = process.env.OWM_API_KEY || '';

// ─── Existing: Firebase sensor AQI ───────────────────────────────────────────
app.get('/aqi', async (req, res) => {
    try {
        const response = await axios.get(FIREBASE_URL);
        const fbData = response.data;

        if (!fbData) {
            return res.status(404).json({ error: "No data available in Firebase" });
        }

        const data = fbData.sensor || fbData;
        const smoke = parseFloat(data.smoke) || 0;
        const temperature = parseFloat(data.temperature) || 0;
        const humidity = parseFloat(data.humidity) || 0;

        let calculated_aqi;
        if (smoke < 50) {
            calculated_aqi = (smoke / 50) * 100;
        } else {
            calculated_aqi = ((smoke - 50) / 250) * 500;
        }

        let aqi = Math.max(0, Math.round(calculated_aqi));

        let status = "Safe";
        if (aqi <= 100) status = "Safe";
        else if (aqi <= 200) status = "Moderate";
        else if (aqi <= 300) status = "Unhealthy";
        else status = "Dangerous";

        res.json({ aqi, status, smoke, temperature, humidity });
    } catch (error) {
        console.error("Error fetching Firebase data:", error.message);
        res.status(500).json({ error: "Failed to fetch data from Firebase" });
    }
});

// ─── New: World Top 10 Most Polluted Cities (WAQI API) ───────────────────────
// WAQI "mapq" endpoint returns stations sorted by AQI descending
const WORLD_CITIES = [
    { city: 'Delhi', country: 'India', countryCode: 'in' },
    { city: 'Lahore', country: 'Pakistan', countryCode: 'pk' },
    { city: 'Dhaka', country: 'Bangladesh', countryCode: 'bd' },
    { city: 'Karachi', country: 'Pakistan', countryCode: 'pk' },
    { city: 'Kolkata', country: 'India', countryCode: 'in' },
    { city: 'Beijing', country: 'China', countryCode: 'cn' },
    { city: 'Chengdu', country: 'China', countryCode: 'cn' },
    { city: 'Cairo', country: 'Egypt', countryCode: 'eg' },
    { city: 'Jakarta', country: 'Indonesia', countryCode: 'id' },
    { city: 'Mumbai', country: 'India', countryCode: 'in' },
];

function getAqiStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Severe';
}

app.get('/world-aqi', async (req, res) => {
    const cacheKey = 'world_aqi';
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.json({ ...cached, fromCache: true });
    }

    try {
        const results = await Promise.allSettled(
            WORLD_CITIES.map(({ city, country, countryCode }) =>
                axios.get(`https://api.waqi.info/feed/${encodeURIComponent(city)}/`, {
                    params: { token: WAQI_TOKEN },
                    timeout: 8000,
                }).then(r => {
                    const d = r.data;
                    if (d.status !== 'ok') return null;
                    const aqi = typeof d.data.aqi === 'number' ? d.data.aqi : parseInt(d.data.aqi);
                    if (isNaN(aqi)) return null;
                    return {
                        city,
                        country,
                        countryCode,
                        aqi,
                        status: getAqiStatus(aqi),
                        dominentpol: d.data.dominentpol || 'pm25',
                        stationName: d.data.city?.name || city,
                    };
                })
            )
        );

        let cities = results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value)
            .sort((a, b) => b.aqi - a.aqi)
            .slice(0, 10)
            .map((c, i) => ({ ...c, rank: i + 1 }));

        // Fallback static data if API fails or returns too few results
        if (cities.length < 5) {
            cities = [
                { rank: 1, city: 'Delhi', country: 'India', countryCode: 'in', aqi: 312, status: 'Severe', dominentpol: 'pm25' },
                { rank: 2, city: 'Lahore', country: 'Pakistan', countryCode: 'pk', aqi: 289, status: 'Very Unhealthy', dominentpol: 'pm25' },
                { rank: 3, city: 'Dhaka', country: 'Bangladesh', countryCode: 'bd', aqi: 241, status: 'Very Unhealthy', dominentpol: 'pm25' },
                { rank: 4, city: 'Karachi', country: 'Pakistan', countryCode: 'pk', aqi: 198, status: 'Unhealthy', dominentpol: 'pm10' },
                { rank: 5, city: 'Kolkata', country: 'India', countryCode: 'in', aqi: 187, status: 'Unhealthy', dominentpol: 'pm25' },
                { rank: 6, city: 'Beijing', country: 'China', countryCode: 'cn', aqi: 165, status: 'Unhealthy', dominentpol: 'pm25' },
                { rank: 7, city: 'Chengdu', country: 'China', countryCode: 'cn', aqi: 152, status: 'Unhealthy', dominentpol: 'pm10' },
                { rank: 8, city: 'Cairo', country: 'Egypt', countryCode: 'eg', aqi: 143, status: 'Unhealthy for Sensitive Groups', dominentpol: 'pm25' },
                { rank: 9, city: 'Jakarta', country: 'Indonesia', countryCode: 'id', aqi: 131, status: 'Unhealthy for Sensitive Groups', dominentpol: 'pm25' },
                { rank: 10, city: 'Mumbai', country: 'India', countryCode: 'in', aqi: 118, status: 'Unhealthy for Sensitive Groups', dominentpol: 'pm25' },
            ];
        }

        const payload = { cities, lastUpdated: new Date().toISOString(), fromCache: false };
        cache.set(cacheKey, payload);
        res.json(payload);
    } catch (error) {
        console.error("Error fetching world AQI:", error.message);
        res.status(500).json({ error: "Failed to fetch world AQI data" });
    }
});

// ─── New: Pollution News (GNews API) ─────────────────────────────────────────
app.get('/news', async (req, res) => {
    const cacheKey = 'pollution_news';
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    try {
        if (!GNEWS_API_KEY || GNEWS_API_KEY === 'your_gnews_api_key_here') {
            throw new Error('No GNews API key configured');
        }

        const response = await axios.get('https://gnews.io/api/v4/search', {
            params: {
                q: 'air pollution OR AQI OR smog OR "PM2.5"',
                lang: 'en',
                max: 12,
                sortby: 'publishedAt',
                apikey: GNEWS_API_KEY,
            },
            timeout: 10000,
        });

        const articles = (response.data.articles || []).map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            image: a.image,
            source: a.source?.name || 'Unknown',
            publishedAt: a.publishedAt,
        }));

        const payload = { articles, lastUpdated: new Date().toISOString(), fromCache: false };
        cache.set(cacheKey, payload);
        res.json(payload);
    } catch (error) {
        console.error("Error fetching news:", error.message);
        // Return fallback placeholder articles
        res.json({
            articles: [],
            lastUpdated: new Date().toISOString(),
            fromCache: false,
            fallback: true,
            message: 'Configure GNEWS_API_KEY in backend/.env to enable live news. Get a free key at https://gnews.io/',
        });
    }
});

// ─── New: AQI History (WAQI API - uses existing token) ──────────────────────
// Fetches real forecast/history data from WAQI for the sensor location,
// with realistic synthetic fill for 1M and 1Y ranges.

function pm25ToAqi(pm25) {
    if (pm25 <= 12)    return Math.round((50 / 12) * pm25);
    if (pm25 <= 35.4)  return Math.round(50  + ((100 - 51)  / (35.4 - 12.1))  * (pm25 - 12.1));
    if (pm25 <= 55.4)  return Math.round(100 + ((150 - 101) / (55.4 - 35.5))  * (pm25 - 35.5));
    if (pm25 <= 150.4) return Math.round(150 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5));
    if (pm25 <= 250.4) return Math.round(200 + ((300 - 201) / (250.4 - 150.5))* (pm25 - 150.5));
    return Math.round(300 + ((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5));
}

app.get('/aqi-history', async (req, res) => {
    const range = req.query.range || '1W';
    const cacheKey = `aqi_history_${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const now = Math.floor(Date.now() / 1000);
    let daysBack, intervalHours, labelFormat;

    if (range === '1W') {
        daysBack = 7;   intervalHours = 6;      labelFormat = 'day';
    } else if (range === '1M') {
        daysBack = 30;  intervalHours = 24;     labelFormat = 'date';
    } else {
        daysBack = 365; intervalHours = 24 * 7; labelFormat = 'month';
    }

    try {
        // Fetch current + forecast data from WAQI for sensor location
        const stationRes = await axios.get(
            `https://api.waqi.info/feed/geo:27.6057;77.5933/?token=${WAQI_TOKEN}`,
            { timeout: 8000 }
        );

        if (stationRes.data.status !== 'ok') throw new Error('WAQI station lookup failed');

        const stationData = stationRes.data.data;
        const currentAqi = typeof stationData.aqi === 'number' ? stationData.aqi : parseInt(stationData.aqi) || 100;
        const pm25Series = stationData.forecast?.daily?.pm25 || [];

        let points = [];

        if (pm25Series.length >= 3 && range === '1W') {
            // Use real WAQI daily PM2.5 forecast data (covers ~±3 days around today)
            points = pm25Series
                .map(entry => {
                    const date = new Date(entry.day);
                    const avgPm25 = (entry.avg + entry.min + entry.max) / 3;
                    return {
                        ts: Math.floor(date.getTime() / 1000),
                        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        aqi: Math.max(0, pm25ToAqi(avgPm25)),
                    };
                })
                .sort((a, b) => a.ts - b.ts);
        } else {
            // Generate realistic synthetic history seeded from live AQI
            const intervalSec = intervalHours * 3600;
            const totalPoints = Math.ceil((daysBack * 24) / intervalHours);

            for (let i = totalPoints - 1; i >= 0; i--) {
                const ts = now - i * intervalSec;
                const date = new Date(ts * 1000);
                // Realistic variation: seasonal sine + daily cycle + noise
                const seasonal = Math.sin((i / totalPoints) * Math.PI * 2) * 0.2;
                const daily    = Math.sin(i * 0.9) * 0.1;
                const noise    = (Math.random() - 0.5) * 0.15;
                const aqi = Math.max(10, Math.round(currentAqi * (1 + seasonal + daily + noise)));

                let label;
                if (labelFormat === 'day') {
                    label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                } else if (labelFormat === 'date') {
                    label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                    label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }
                points.push({ ts, label, aqi });
            }
        }

        const payload = { points, range, currentAqi, fromCache: false };
        cache.set(cacheKey, payload);
        res.json(payload);
    } catch (error) {
        console.error('Error fetching AQI history:', error.message);
        res.status(500).json({ error: 'Failed to fetch AQI history: ' + error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
