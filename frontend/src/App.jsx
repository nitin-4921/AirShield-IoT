import React, { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, Cloud, Thermometer, Droplets, Wind, LayoutDashboard, History, Bell, HelpCircle, User, Battery, Activity, CheckCircle2, AlertTriangle, AlertCircle, Edit2, Send, Plus, Lock, ArrowRight, MapPin, ChevronDown, Globe, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';const LOCATIONS = [
  { id: 1, name: 'GLA University Mathura', aqi: 145, pm25: 78, pm10: 155, o3: 42, temp: 32, humidity: 45, wind: 8, pressure: 1005, visibility: 5.2, coords: { x: '47.2%', y: '48.0%' }, lat: 27.6057, lng: 77.5933 },
  { id: 2, name: 'Dwarkadhish Temple', aqi: 180, pm25: 95, pm10: 190, o3: 48, temp: 33, humidity: 44, wind: 6, pressure: 1006, visibility: 4.5, coords: { x: '53.2%', y: '51.5%' }, lat: 27.4984, lng: 77.6835 },
  { id: 3, name: 'Prem Mandir, Vrindavan', aqi: 110, pm25: 55, pm10: 110, o3: 35, temp: 31, humidity: 48, wind: 10, pressure: 1004, visibility: 6.8, coords: { x: '48.4%', y: '13.5%' }, lat: 27.5732, lng: 77.6710 },
  { id: 4, name: 'Mathura Cantt', aqi: 90, pm25: 42, pm10: 85, o3: 28, temp: 32, humidity: 42, wind: 12, pressure: 1005, visibility: 8.0, coords: { x: '54.0%', y: '62.0%' }, lat: 27.4699, lng: 77.6791 },
];

const getAqiConfig = (aqi) => {
  if (aqi <= 50) return { label: 'Excellent', color: 'text-success', stroke: '#00E676', percentage: Math.min((aqi/50)*25, 25) };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-warning', stroke: '#FFB020', percentage: Math.min(25 + ((aqi-50)/50)*25, 50) };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-[#FF5252]', stroke: '#FF5252', percentage: Math.min(50 + ((aqi-100)/100)*25, 75) };
  return { label: 'Hazardous', color: 'text-[#FF5252]', stroke: '#FF5252', percentage: Math.min(75 + ((aqi-200)/100)*25, 100) };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentLocIdx, setCurrentLocIdx] = useState(0);
  const [realTimeData, setRealTimeData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const searchRef = useRef(null);

  const NAV_PAGES = ['Dashboard', 'World AQI', 'Map Overview', 'History', 'Alerts', 'Pollution News', 'Support', 'Account'];
  const SEARCHABLE = [
    ...NAV_PAGES.map(p => ({ type: 'page', label: p })),
    ...LOCATIONS.map(l => ({ type: 'location', label: l.name, aqi: l.aqi })),
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3000/aqi');
        if (res.ok) {
          const json = await res.json();
          setRealTimeData(prev => {
            // Generate real alerts based on AQI thresholds
            if (json.aqi !== prev?.aqi) {
              const now = new Date();
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (json.aqi > 300 && (!prev || prev.aqi <= 300)) {
                setAlerts(a => [{ id: Date.now(), type: 'critical', msg: `Dangerous AQI level ${json.aqi} detected at live sensor. Avoid outdoor activity.`, time: timeStr }, ...a]);
              } else if (json.aqi > 200 && (!prev || prev.aqi <= 200)) {
                setAlerts(a => [{ id: Date.now(), type: 'critical', msg: `Unhealthy AQI level ${json.aqi} detected. Sensitive groups should stay indoors.`, time: timeStr }, ...a]);
              } else if (json.aqi > 100 && (!prev || prev.aqi <= 100)) {
                setAlerts(a => [{ id: Date.now(), type: 'warning', msg: `Moderate AQI ${json.aqi} detected. Consider reducing prolonged outdoor exertion.`, time: timeStr }, ...a]);
              } else if (json.aqi <= 100 && prev && prev.aqi > 100) {
                setAlerts(a => [{ id: Date.now(), type: 'info', msg: `AQI returned to safe levels (${json.aqi}). Air quality is now acceptable.`, time: timeStr }, ...a]);
              }
            }
            return json;
          });
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const q = searchQuery.toLowerCase();
    const results = SEARCHABLE.filter(s => s.label.toLowerCase().includes(q));
    setSearchResults(results);
    setShowSearch(true);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseData = LOCATIONS[currentLocIdx];
  const data = realTimeData ? {
    ...baseData,
    aqi: realTimeData.aqi,
    temp: Math.round(realTimeData.temperature),
    humidity: Math.round(realTimeData.humidity),
    pm25: realTimeData.smoke,
  } : baseData;

  const aqiConfig = getAqiConfig(data.aqi);

  // Auto-cycle locations only on Dashboard
  useEffect(() => {
    if (activeTab !== 'Dashboard') return;
    const timer = setInterval(() => {
      setCurrentLocIdx((prev) => (prev + 1) % LOCATIONS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-background text-[#475569] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 xl:w-72 flex flex-col py-8 px-6 border-r border-[#cfdce5]/50 z-20 flex-shrink-0">
        <div className="flex items-center justify-center xl:justify-start xl:pl-4 mb-12">
          <div className="w-14 h-14 neu-flat-round flex items-center justify-center text-primary flex-shrink-0">
            <Wind className="w-7 h-7" />
          </div>
          <span className="hidden xl:block ml-5 text-3xl display-font font-extrabold tracking-tighter text-[#0f172a]">AirShield</span>
        </div>

        <nav className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={<Globe />} label="World AQI" active={activeTab === 'World AQI'} onClick={() => setActiveTab('World AQI')} />
          <NavItem icon={<MapIcon />} label="Map Overview" active={activeTab === 'Map Overview'} onClick={() => setActiveTab('Map Overview')} />
          <NavItem icon={<History />} label="History" active={activeTab === 'History'} onClick={() => setActiveTab('History')} />
          <NavItem icon={<Bell />} label="Alerts" active={activeTab === 'Alerts'} onClick={() => setActiveTab('Alerts')} badge={alerts.filter(a => a.type === 'critical').length} />
          <NavItem icon={<Newspaper />} label="Pollution News" active={activeTab === 'Pollution News'} onClick={() => setActiveTab('Pollution News')} />
        </nav>
        
        <div className="mt-auto flex flex-col gap-6 pt-6 border-t border-[#cfdce5]/50">
          <NavItem icon={<HelpCircle />} label="Support" active={activeTab === 'Support'} onClick={() => setActiveTab('Support')} />
          <NavItem icon={<User />} label="Account" active={activeTab === 'Account'} onClick={() => setActiveTab('Account')} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-20 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 xl:px-12 pt-8 pb-6 flex-shrink-0">
          <div>
            <h1 className="display-font text-4xl font-extrabold text-[#0f172a]">
              {activeTab === 'Dashboard' ? data.name : activeTab}
            </h1>
            <p className="font-medium text-lg mt-1 text-[#475569] hidden md:block">
              {activeTab === 'Dashboard' ? 'Precision Air Quality Monitoring' 
                : activeTab === 'World AQI' ? 'Live AQI Ranking – World Most Polluted Cities 2026'
                : activeTab === 'Map Overview' ? 'Geospatial Distribution of Sensors'
                : activeTab === 'History' ? 'Historical AQI & Telemetry Data'
                : activeTab === 'Alerts' ? 'System Notifications & Warnings'
                : activeTab === 'Pollution News' ? 'Real-Time Air Quality & Pollution News'
                : activeTab === 'Support' ? 'Help Center & Documentation'
                : 'Manage Profile & Settings'}
            </p>
          </div>
          <div className="relative w-72 xl:w-96" ref={searchRef}>
            <div className="neu-pressed px-6 py-4 flex items-center cursor-text">
              <Search className="w-5 h-5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search pages, locations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearch(true)}
                className="bg-transparent border-none outline-none w-full ml-4 text-[#0f172a] placeholder-[#94a3b8] font-medium"
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-background neu-flat rounded-2xl overflow-hidden z-50 shadow-lg">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    className="px-6 py-4 hover:bg-primary/10 cursor-pointer flex items-center gap-3 font-bold text-[#0f172a]"
                    onClick={() => {
                      if (r.type === 'page') setActiveTab(r.label);
                      else {
                        const idx = LOCATIONS.findIndex(l => l.name === r.label);
                        if (idx !== -1) { setCurrentLocIdx(idx); setActiveTab('Dashboard'); }
                      }
                      setSearchQuery('');
                      setShowSearch(false);
                    }}
                  >
                    {r.type === 'page' ? <LayoutDashboard className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-warning" />}
                    <span>{r.label}</span>
                    {r.type === 'location' && <span className="ml-auto text-sm text-[#64748b]">AQI {r.aqi}</span>}
                  </div>
                ))}
              </div>
            )}
            {showSearch && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-background neu-flat rounded-2xl z-50 px-6 py-4 text-[#94a3b8] font-medium">
                No results found
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Dynamic Views */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 xl:px-12 pb-12 pt-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === 'Dashboard' && <DashboardView data={data} aqiConfig={aqiConfig} />}
              {activeTab === 'World AQI' && <WorldAqiView />}
              {activeTab === 'Map Overview' && <MapView />}
              {activeTab === 'History' && <HistoryView />}
              {activeTab === 'Alerts' && <AlertsView alerts={alerts} />}
              {activeTab === 'Pollution News' && <PollutionNewsView />}
              {activeTab === 'Support' && <SupportView />}
              {activeTab === 'Account' && <AccountView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-VIEWS
// ----------------------------------------------------------------------

function DashboardView({ data, aqiConfig }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
      {/* Col 1: Hero Metric & Info Tiles */}
      <div className="flex flex-col gap-10">
        <div className="neu-flat p-10 flex flex-col items-center justify-center relative min-h-[360px]">
          <h3 className="display-font text-2xl font-bold mb-8 w-full text-left text-[#0f172a]">Current AQI</h3>
          <div className="relative w-64 h-64 neu-flat-round flex items-center justify-center">
            <div className="absolute inset-4 neu-pressed-round flex flex-col items-center justify-center">
              <span className="display-font text-7xl font-extrabold tracking-tighter text-[#0f172a]">{data.aqi}</span>
              <span className={`text-base font-bold uppercase tracking-widest mt-2 ${aqiConfig.color}`}>{aqiConfig.label}</span>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="transparent" strokeWidth="8" />
              <motion.circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={aqiConfig.stroke} 
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 289 - (289 * aqiConfig.percentage) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="drop-shadow-md"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <InfoTile icon={<Droplets />} value={`${data.humidity}%`} label="Humidity" />
          <InfoTile icon={<Thermometer />} value={`${data.temp}°C`} label="Temp" />
          <InfoTile icon={<Wind />} value={data.wind} label="Wind" suffix="mph" />
          <InfoTile icon={<Activity />} value={data.aqi ? Math.max(0, Math.round(data.aqi + (data.pm25 - 50) * 0.2)) : '--'} label="AQI IN 30M" />
        </div>
      </div>

      {/* Col 2: Pollutants & Controls */}
      <div className="flex flex-col gap-10">
        <div className="neu-flat p-10">
          <h3 className="display-font text-2xl font-bold mb-10 text-[#0f172a]">Pollutants Breakdown</h3>
          <div className="flex justify-between items-end h-56 gap-6 px-4">
            <BarIndicator label="PM 2.5" value={data.pm25} max={300} color="#00D1FF" />
            <BarIndicator label="PM 10" value={data.pm10} max={400} color="#00D1FF" />
            <BarIndicator label="O3" value={data.o3} max={150} color="#FFB020" />
            <BarIndicator label="NO2" value={Math.round(data.aqi * 0.4)} max={200} color="#FF5252" />
          </div>
        </div>

        <div className="neu-flat p-10 flex flex-col gap-8">
          <h3 className="display-font text-2xl font-bold text-[#0f172a]">System Controls</h3>
          <ToggleRow label="Auto-Purge Filters" defaultOn={true} />
          <ToggleRow label="Alert Notifications" defaultOn={false} />
          <ToggleRow label="Eco Mode Sync" defaultOn={true} />
        </div>
      </div>

      {/* Col 3: Hardware Health & Trends */}
      <div className="flex flex-col gap-10 lg:col-span-2 2xl:col-span-1">
        <div className="neu-flat p-10 h-72 flex flex-col">
          <h3 className="display-font text-2xl font-bold mb-6 text-[#0f172a]">AQI Trends (24h)</h3>
          <div className="flex-1 neu-pressed-sm w-full relative overflow-hidden flex items-end p-0 rounded-xl">
            <div className="w-full h-full opacity-70 flex items-end pb-4 pt-10 px-4 gap-3">
               {[40, 50, 45, 60, 30, 20, 35, 80, 120, 90, 60, data.aqi].map((val, i) => (
                 <motion.div key={i} 
                  className="flex-1 bg-primary rounded-t-md"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((val/300)*100, 100)}%` }}
                  transition={{ delay: i * 0.05 }}
                 />
               ))}
            </div>
          </div>
        </div>

        <div className="neu-flat p-10">
          <h3 className="display-font text-2xl font-bold mb-8 text-[#0f172a]">Hardware Telemetry</h3>
          <div className="space-y-8">
            <ProgressBar label="Main Cell Battery" value={86} color="#00E676" />
            <ProgressBar label="Backup Array" value={100} color="#00E676" />
            <ProgressBar label="Connectivity" value={92} color="#00D1FF" />
          </div>

           <div className="mt-10 pt-10 border-t border-[#cfdce5]/50 flex justify-around">
             <Donut percentage={68} label="HEPA Filter" color="#00D1FF" />
             <Donut percentage={24} label="Carbon Filter" color="#FF5252" />
           </div>
        </div>
      </div>
    </div>
  );
}


function MapView() {
  const createNeuIcon = (aqi) => {
    const colorClass = aqi > 200 ? 'text-[#FF5252]' : aqi > 100 ? 'text-[#FFB020]' : 'text-[#00E676]';
    const bgColorClass = aqi > 200 ? 'bg-[#FF5252]' : aqi > 100 ? 'bg-[#FFB020]' : 'bg-[#00E676]';
    
    return L.divIcon({
      className: 'bg-transparent border-none', // Disable default leaf bg
      html: `
        <div class="relative group cursor-pointer w-14 h-14">
          <div class="w-14 h-14 neu-flat-round flex items-center justify-center z-10 relative ${colorClass}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div class="absolute inset-0 rounded-full animate-ping opacity-50 z-0 ${bgColorClass}"></div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -60]
    });
  };

  return (
    <div className="w-full h-[80vh] neu-pressed rounded-[2rem] relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Leaflet Map Integration */}
      <MapContainer 
        center={[27.52, 77.67]} 
        zoom={12} 
        style={{ width: '100%', height: '100%', borderRadius: '2rem', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="grayscale opacity-50 mix-blend-multiply"
        />
        
        {LOCATIONS.map((loc, i) => (
          <Marker 
            key={i} 
            position={[loc.lat, loc.lng]} 
            icon={createNeuIcon(loc.aqi)}
          >
            <Popup className="neu-popup">
              <div className="neu-flat p-4 !bg-background !border-none !shadow-none m-0">
                <p className="font-bold text-[#0f172a] text-center mb-2">{loc.name}</p>
                <div className="flex justify-between font-bold text-sm">
                  <span>AQI:</span>
                  <span className={loc.aqi > 200 ? 'text-danger' : loc.aqi > 100 ? 'text-warning' : 'text-success'}>{loc.aqi}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* HUD Elements */}
      <div className="absolute top-10 left-10 neu-flat p-6 z-[400] pointer-events-auto">
         <h4 className="display-font font-bold text-xl text-[#0f172a] mb-2">Global Network</h4>
         <p className="font-medium text-sm">4 Active Nodes</p>
      </div>
    </div>
  );
}

function WorldAqiView() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3000/world-aqi');
      if (res.ok) {
        const json = await res.json();
        setCities(json.cities || []);
        setLastUpdated(json.lastUpdated);
      }
    } catch (err) {
      console.error('World AQI fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status === 'Good') return 'text-success';
    if (status === 'Moderate') return 'text-warning';
    if (status === 'Unhealthy for Sensitive Groups') return 'text-[#FFB020]';
    if (status === 'Unhealthy') return 'text-[#FF5252]';
    if (status === 'Very Unhealthy') return 'text-[#FF5252]';
    return 'text-danger';
  };

  const getAqiBarColor = (aqi) => {
    if (aqi <= 50) return '#00E676';
    if (aqi <= 100) return '#FFB020';
    if (aqi <= 150) return '#FFB020';
    if (aqi <= 200) return '#FF5252';
    if (aqi <= 300) return '#FF5252';
    return '#b91c1c';
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-flat-round flex items-center justify-center text-primary">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="display-font text-2xl font-bold text-[#0f172a]">Live AQI Ranking</h3>
            <p className="text-sm font-semibold text-[#64748b]">World Most Polluted Cities 2026</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="neu-pressed-sm px-5 py-3 text-sm font-bold text-[#64748b]">
            Last updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="neu-flat p-8">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 neu-pressed-sm rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#cfdce5]/50">
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">#</th>
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">City</th>
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">Country</th>
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">AQI</th>
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b] hidden md:table-cell">Level</th>
                  <th className="text-left py-4 px-4 text-xs font-extrabold uppercase tracking-widest text-[#64748b] hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c, i) => (
                  <motion.tr
                    key={c.city}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-[#cfdce5]/30 hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-5 px-4">
                      <span className={`display-font text-lg font-extrabold ${i < 3 ? 'text-primary' : 'text-[#94a3b8]'}`}>
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://flagcdn.com/24x18/${c.countryCode}.png`}
                          alt={c.country}
                          className="rounded-sm shadow-sm"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <span className="font-bold text-[#0f172a]">{c.city}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 font-semibold text-[#64748b]">{c.country}</td>
                    <td className="py-5 px-4">
                      <span className="display-font text-xl font-extrabold text-[#0f172a]">{c.aqi}</span>
                    </td>
                    <td className="py-5 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-3 w-40">
                        <div className="flex-1 h-2 neu-pressed-sm rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: getAqiBarColor(c.aqi) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((c.aqi / 400) * 100, 100)}%` }}
                            transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 hidden lg:table-cell">
                      <span className={`text-sm font-bold ${getStatusColor(c.status)}`}>{c.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {cities.length === 0 && (
              <p className="text-center py-12 font-medium text-[#94a3b8]">No data available. Check backend connection.</p>
            )}
          </div>
        )}
      </div>

      {/* AQI Legend */}
      <div className="neu-flat p-8">
        <h4 className="display-font text-lg font-bold text-[#0f172a] mb-6">AQI Scale Reference</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { range: '0–50', label: 'Good', color: '#00E676' },
            { range: '51–100', label: 'Moderate', color: '#FFB020' },
            { range: '101–150', label: 'Sensitive Groups', color: '#FF9800' },
            { range: '151–200', label: 'Unhealthy', color: '#FF5252' },
            { range: '201–300', label: 'Very Unhealthy', color: '#c0392b' },
            { range: '301+', label: 'Severe', color: '#7b241c' },
          ].map(s => (
            <div key={s.label} className="neu-pressed-sm p-4 flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-extrabold text-[#0f172a]">{s.range}</span>
              <span className="text-xs font-semibold text-[#64748b] text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PollutionNewsView() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fallbackMsg, setFallbackMsg] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('http://localhost:3000/news');
        if (res.ok) {
          const json = await res.json();
          setArticles(json.articles || []);
          setLastUpdated(json.lastUpdated);
          if (json.fallback) setFallbackMsg(json.message || '');
        }
      } catch (err) {
        console.error('News fetch error:', err);
        setFallbackMsg('Unable to connect to backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neu-flat-round flex items-center justify-center text-primary">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h3 className="display-font text-2xl font-bold text-[#0f172a]">Pollution News</h3>
            <p className="text-sm font-semibold text-[#64748b]">Real-time air quality & pollution updates</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="neu-pressed-sm px-5 py-3 text-sm font-bold text-[#64748b]">
            Last updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Fallback message if no API key */}
      {fallbackMsg && (
        <div className="neu-pressed-sm px-6 py-5 flex items-center gap-4">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="font-medium text-[#64748b] text-sm">{fallbackMsg}</p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="neu-flat p-6 flex flex-col gap-4">
              <div className="h-44 neu-pressed-sm rounded-xl animate-pulse" />
              <div className="h-4 neu-pressed-sm rounded-lg animate-pulse w-3/4" />
              <div className="h-3 neu-pressed-sm rounded-lg animate-pulse" />
              <div className="h-3 neu-pressed-sm rounded-lg animate-pulse w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Articles grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {articles.map((a, i) => (
            <motion.a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="neu-flat p-6 flex flex-col gap-5 cursor-pointer hover:shadow-lg transition-shadow group"
            >
              {/* Image */}
              <div className="w-full h-44 neu-pressed-sm rounded-xl overflow-hidden flex-shrink-0">
                {a.image ? (
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[#94a3b8]"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'><path d=\'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\'/></svg></div>'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#94a3b8]">
                    <Cloud className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary">{a.source}</span>
                <span className="text-xs font-semibold text-[#94a3b8]">{formatDate(a.publishedAt)}</span>
              </div>

              {/* Title */}
              <h4 className="display-font font-bold text-[#0f172a] text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {a.title}
              </h4>

              {/* Description */}
              {a.description && (
                <p className="text-sm font-medium text-[#64748b] leading-relaxed line-clamp-3">{a.description}</p>
              )}

              {/* Read more */}
              <div className="mt-auto flex items-center gap-2 text-primary font-bold text-sm">
                <span>Read full article</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && !fallbackMsg && (
        <div className="neu-flat p-16 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 neu-flat-round flex items-center justify-center text-[#94a3b8]">
            <Newspaper className="w-10 h-10" />
          </div>
          <h3 className="display-font text-xl font-bold text-[#0f172a]">No articles found</h3>
          <p className="font-medium text-[#64748b]">Add your GNews API key in backend/.env to load live news.</p>
        </div>
      )}
    </div>
  );
}

function HistoryView() {
  return (
    <div className="flex flex-col gap-10">
      <div className="neu-flat p-10 h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <h3 className="display-font text-2xl font-bold text-[#0f172a]">Historical AQI Timeline</h3>
          <div className="flex gap-4">
             <button className="neu-btn px-6 py-3 font-bold active text-primary">1W</button>
             <button className="neu-btn px-6 py-3 font-bold">1M</button>
             <button className="neu-btn px-6 py-3 font-bold">1Y</button>
          </div>
        </div>
        <div className="flex-1 neu-pressed-sm w-full relative flex items-end p-6 gap-4">
           {Array.from({length: 30}).map((_, i) => (
             <motion.div key={i} 
              className="flex-1 bg-[#00D1FF] rounded-t-md opacity-80"
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 80 + 20}%` }}
              transition={{ delay: i * 0.02 }}
             />
           ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="neu-flat p-10">
            <h3 className="display-font text-2xl font-bold text-[#0f172a] mb-6">Data Export</h3>
            <p className="mb-8 font-medium">Download historical telemetry data in CSV or JSON formats for external analysis.</p>
            <div className="space-y-6">
               <button className="w-full neu-btn py-5 font-bold flex items-center justify-center gap-3 text-[#0f172a]">
                 <Cloud className="w-5 h-5" /> Export Last 7 Days
               </button>
               <button className="w-full neu-btn py-5 font-bold flex items-center justify-center gap-3 text-[#0f172a]">
                 <Activity className="w-5 h-5" /> Export Full History
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function AlertsView({ alerts }) {
  const isEmpty = alerts.length === 0;
  return (
    <div className="max-w-4xl max-w-full">
      {isEmpty ? (
        <div className="neu-flat p-16 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 neu-flat-round flex items-center justify-center text-success">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="display-font text-2xl font-bold text-[#0f172a]">All Clear</h3>
          <p className="font-medium text-[#64748b]">No alerts at the moment. Air quality is being monitored in real-time.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {alerts.map(a => (
            <div key={a.id} className="neu-flat p-8 flex items-center gap-6">
              <div className={`w-14 h-14 shrink-0 neu-flat-round flex items-center justify-center 
                ${a.type === 'critical' ? 'text-danger' : a.type === 'warning' ? 'text-warning' : 'text-primary'}`}>
                {a.type === 'critical' ? <AlertTriangle className="w-6 h-6" />
                  : a.type === 'warning' ? <AlertCircle className="w-6 h-6" />
                  : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg text-[#0f172a] mb-1">{a.msg}</h4>
                <p className="text-sm font-semibold text-[#64748b]">{a.time}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest neu-pressed-sm
                ${a.type === 'critical' ? 'text-danger bg-danger/10' : a.type === 'warning' ? 'text-warning bg-warning/10' : 'text-primary bg-primary/10'}`}>
                {a.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportView() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How often does the sensor calibrate?",
      a: "The AirShield sensor performs an automatic self-calibration every 24 hours. It uses a baseline algorithm that adjusts readings based on ambient conditions. You can also trigger a manual calibration from the sensor configuration panel at any time."
    },
    {
      q: "What is the battery replacement cycle?",
      a: "Under normal operating conditions with continuous monitoring, the main cell battery lasts approximately 6–8 months. The backup array is rated for 12 months. You'll receive a warning alert on the Alerts page when battery drops below 20%."
    },
    {
      q: "How to interpret AQI metrics?",
      a: "AQI (Air Quality Index) ranges from 0 to 500. 0–50 is Excellent (safe for all), 51–100 is Moderate (acceptable), 101–200 is Unhealthy (sensitive groups at risk), 201–300 is Very Unhealthy (everyone may be affected), and above 300 is Dangerous (avoid all outdoor activity)."
    },
  ];

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    const mailto = `mailto:nitin1019b@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="flex flex-col gap-8">
        <h3 className="display-font text-3xl font-bold text-[#0f172a]">Contact Support</h3>
        <div className="neu-flat p-10 flex flex-col gap-8">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[#64748b] mb-4">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full neu-pressed px-6 py-5 outline-none font-bold text-[#0f172a]"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[#64748b] mb-4">Message</label>
            <textarea
              rows="6"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full neu-pressed px-6 py-5 outline-none font-medium custom-scrollbar text-[#0f172a] resize-none"
              placeholder="Describe your issue in detail..."
            />
          </div>
          <button
            onClick={handleSend}
            className="neu-btn w-full py-5 font-bold text-lg text-primary flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" /> Send Message
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <h3 className="display-font text-3xl font-bold text-[#0f172a]">FAQ</h3>
        {faqs.map((faq, i) => (
          <div key={i} className="neu-flat overflow-hidden">
            <div
              className="p-8 cursor-pointer flex justify-between items-center"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span className="font-bold text-lg text-[#0f172a] pr-4">{faq.q}</span>
              <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                <ChevronDown className="w-5 h-5 text-[#64748b]" />
              </motion.div>
            </div>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-8 pb-8 font-medium text-[#475569] leading-relaxed border-t border-[#cfdce5]/50 pt-4">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountView() {
  return (
    <div className="max-w-4xl">
       <div className="neu-flat p-10 flex items-center gap-10 mb-10">
          <div className="relative w-32 h-32 neu-flat-round p-2 flex-shrink-0">
             <img src="https://ui-avatars.com/api/?name=Admin+User&background=00D1FF&color=fff&size=256" alt="Profile" className="w-full h-full rounded-full object-cover" />
             <div className="absolute bottom-0 right-0 w-10 h-10 neu-btn-round flex items-center justify-center text-primary cursor-pointer">
               <Edit2 className="w-4 h-4" />
             </div>
          </div>
          <div>
            <h2 className="display-font text-3xl font-extrabold text-[#0f172a] mb-2">Administrator</h2>
            <p className="font-bold text-lg text-[#64748b]">admin@airshield.io</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
         <div className="neu-flat p-8">
           <h3 className="display-font text-xl font-bold text-[#0f172a] mb-8 flex items-center gap-3"><User /> Profile Information</h3>
           <div className="space-y-6">
             <div>
               <label className="block text-sm font-bold text-[#64748b] mb-3">Full Name</label>
               <input type="text" defaultValue="Administrator" className="w-full neu-pressed px-6 py-4 outline-none font-bold text-[#0f172a]" />
             </div>
             <div>
               <label className="block text-sm font-bold text-[#64748b] mb-3">Email Address</label>
               <input type="email" defaultValue="admin@airshield.io" className="w-full neu-pressed px-6 py-4 outline-none font-bold text-[#0f172a]" />
             </div>
           </div>
         </div>

         <div className="neu-flat p-8">
           <h3 className="display-font text-xl font-bold text-[#0f172a] mb-8 flex items-center gap-3"><Lock /> Security</h3>
           <div className="space-y-6">
             <div>
               <label className="block text-sm font-bold text-[#64748b] mb-3">Current Password</label>
               <input type="password" value="********" readOnly className="w-full neu-pressed px-6 py-4 outline-none font-bold text-[#0f172a]" />
             </div>
             <button className="neu-btn w-full py-4 font-bold text-[#0f172a]">Change Password</button>
           </div>
         </div>
       </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// REUSABLE COMPONENTS
// ----------------------------------------------------------------------

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} className={`neu-btn flex items-center xl:gap-5 px-4 xl:px-6 py-5 cursor-pointer text-[#475569] font-semibold w-16 xl:w-full justify-center xl:justify-start ${active ? 'active text-primary' : ''}`}>
      <span className={`${active ? 'text-primary' : 'text-[#64748b]'} flex-shrink-0 w-6 h-6 flex justify-center items-center relative`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger rounded-full text-white text-[9px] font-extrabold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="hidden xl:block font-bold text-[1.05rem] whitespace-nowrap">{label}</span>
      {active && <div className="hidden xl:block ml-auto w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#00D1FF] flex-shrink-0" />}
    </div>
  );
}

function InfoTile({ icon, value, label, suffix }) {
  return (
    <div className="neu-flat p-6 flex flex-col items-center justify-center text-center Aspect-square">
      <div className="text-primary mb-4 w-12 h-12 neu-pressed-round flex items-center justify-center">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div className="display-font text-2xl font-extrabold text-[#0f172a]">{value}</div>
      <div className="font-bold text-xs uppercase tracking-widest mt-2 text-[#64748b]">{label}</div>
    </div>
  );
}

function BarIndicator({ label, value, max, color }) {
  const heightPercent = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col items-center w-14 h-full justify-end">
      <span className="display-font text-base font-bold text-[#0f172a] mb-3">{value}</span>
      <div className="w-10 h-full neu-pressed-sm relative flex items-end p-1.5">
        <motion.div 
          className="w-full rounded-md drop-shadow-sm"
          style={{ backgroundColor: color }}
          initial={{ height: 0 }}
          animate={{ height: `${heightPercent}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
      </div>
      <span className="text-xs font-bold uppercase mt-5 text-[#64748b] tracking-widest">{label}</span>
    </div>
  );
}

function ToggleRow({ label, defaultOn }) {
  const [isOn, setIsOn] = useState(defaultOn);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleToggle = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusMsg("Syncing with node...");
    setTimeout(() => {
      const newState = !isOn;
      setIsOn(newState);
      setIsProcessing(false);
      setStatusMsg(newState ? "Successfully Enabled" : "Successfully Disabled");
      setTimeout(() => setStatusMsg(""), 2500);
    }, 1200);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between py-3 cursor-pointer" onClick={handleToggle}>
        <span className="font-bold text-[#475569] text-lg">{label}</span>
        <div className={`w-16 h-9 rounded-full flex items-center p-1 transition-colors duration-300 shadow-inner ${isOn ? 'neu-pressed' : 'neu-flat'}`}>
          <motion.div 
            className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center ${isOn ? 'bg-primary' : 'bg-[#94a3b8]'}`}
            animate={{ x: isOn ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isProcessing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className={`text-sm font-bold text-right -mt-1 ${statusMsg.includes('Enabled') ? 'text-success' : statusMsg.includes('Disabled') ? 'text-warning' : 'text-primary'}`}
          >
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-base font-bold mb-3">
        <span className="text-[#475569]">{label}</span>
        <span className="text-[#0f172a]">{value}%</span>
      </div>
      <div className="h-4 w-full neu-pressed-sm p-1 rounded-full">
        <motion.div 
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Donut({ percentage, label, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 neu-flat-round flex items-center justify-center">
         <div className="absolute inset-2.5 neu-pressed-round flex items-center justify-center">
           <span className="text-base font-bold text-[#0f172a]">{percentage}%</span>
         </div>
         <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 40 40">
            <motion.circle 
              cx="20" cy="20" r="17" 
              fill="none" 
              stroke={color} 
              strokeWidth="2.5"
              strokeDasharray="106.8" 
              initial={{ strokeDashoffset: 106.8 }}
              animate={{ strokeDashoffset: 106.8 - (106.8 * percentage) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
         </svg>
      </div>
      <span className="text-sm font-bold uppercase tracking-wider mt-4 text-[#64748b]">{label}</span>
    </div>
  );
}



