import React, { useState, useEffect } from 'react';
import { Search, Map as MapIcon, Cloud, Thermometer, Droplets, Wind, LayoutDashboard, History, Bell, HelpCircle, User, Battery, Activity, CheckCircle2, AlertTriangle, AlertCircle, Edit2, Settings, MapPin, Send, Plus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';const LOCATIONS = [
  { id: 1, name: 'Shri Krishna Janmasthan', aqi: 145, pm25: 78, pm10: 155, o3: 42, temp: 32, humidity: 45, wind: 8, pressure: 1005, visibility: 5.2, coords: { x: '47.2%', y: '48.0%' }, lat: 27.5050, lng: 77.6713 },
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3000/aqi');
        if (res.ok) {
          const json = await res.json();
          setRealTimeData(json);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
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
          <NavItem icon={<Cloud />} label="Sensors" active={activeTab === 'Sensors'} onClick={() => setActiveTab('Sensors')} />
          <NavItem icon={<MapIcon />} label="Map Overview" active={activeTab === 'Map Overview'} onClick={() => setActiveTab('Map Overview')} />
          <NavItem icon={<History />} label="History" active={activeTab === 'History'} onClick={() => setActiveTab('History')} />
          <NavItem icon={<Bell />} label="Alerts" active={activeTab === 'Alerts'} onClick={() => setActiveTab('Alerts')} />
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
                : activeTab === 'Sensors' ? 'Manage & Monitor Connected Hardware'
                : activeTab === 'Map Overview' ? 'Geospatial Distribution of Sensors'
                : activeTab === 'History' ? 'Historical AQI & Telemetry Data'
                : activeTab === 'Alerts' ? 'System Notifications & Warnings'
                : activeTab === 'Support' ? 'Help Center & Documentation'
                : 'Manage Profile & Settings'}
            </p>
          </div>
          <div className="w-72 xl:w-96 neu-pressed px-6 py-4 flex items-center cursor-text">
            <Search className="w-5 h-5 text-[#94a3b8]" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full ml-4 text-[#0f172a] placeholder-[#94a3b8] font-medium" />
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
              {activeTab === 'Sensors' && <SensorsView />}
              {activeTab === 'Map Overview' && <MapView />}
              {activeTab === 'History' && <HistoryView />}
              {activeTab === 'Alerts' && <AlertsView />}
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

        <div className="grid grid-cols-3 gap-6">
          <InfoTile icon={<Droplets />} value={`${data.humidity}%`} label="Humidity" />
          <InfoTile icon={<Thermometer />} value={`${data.temp}°C`} label="Temp" />
          <InfoTile icon={<Wind />} value={data.wind} label="Wind" suffix="mph" />
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

function SensorsView() {
  const sensors = [
    { id: 'SENS-001', name: 'Shri Krishna Janmasthan Node', status: 'Online', battery: 94, aqi: 145 },
    { id: 'SENS-002', name: 'Dwarkadhish Temple Node', status: 'Warning', battery: 42, aqi: 180 },
    { id: 'SENS-003', name: 'Prem Mandir Node', status: 'Online', battery: 88, aqi: 110 },
    { id: 'SENS-004', name: 'Mathura Junction', status: 'Offline', battery: 0, aqi: null },
    { id: 'SENS-005', name: 'Mathura Cantt', status: 'Online', battery: 76, aqi: 90 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {sensors.map(s => (
        <div key={s.id} className="neu-flat p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 neu-flat-round flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <StatusBadge status={s.status} />
          </div>
          <h3 className="display-font text-xl font-bold text-[#0f172a] mb-1">{s.name}</h3>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#64748b] mb-8">{s.id}</p>
          
          <div className="mt-auto space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-bold flex items-center gap-2"><Battery className="w-4 h-4"/> Battery</span>
              <span className="font-extrabold text-[#0f172a]">{s.battery}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold flex items-center gap-2"><Cloud className="w-4 h-4"/> Current AQI</span>
              <span className="font-extrabold text-[#0f172a]">{s.aqi !== null ? s.aqi : '--'}</span>
            </div>
            <button className="w-full mt-4 neu-btn py-4 font-bold text-[#0f172a]">Configuration</button>
          </div>
        </div>
      ))}
      <div className="neu-flat p-8 border-2 border-dashed border-[#cfdce5] flex flex-col items-center justify-center text-[#94a3b8] cursor-pointer hover:text-primary transition-colors">
        <Plus className="w-12 h-12 mb-4" />
        <span className="font-bold text-lg">Add New Sensor</span>
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

function AlertsView() {
  const alerts = [
    { id: 1, type: 'critical', msg: 'Unhealthy AQI levels detected at Dwarkadhish Node.', time: '10 mins ago' },
    { id: 2, type: 'warning', msg: 'Dwarkadhish Temple sensor battery low (42%).', time: '1 hour ago' },
    { id: 3, type: 'info', msg: 'Auto-purge completed successfully on Janmasthan Node.', time: '3 hours ago' },
    { id: 4, type: 'warning', msg: 'System update available for 3 nodes.', time: '1 day ago' },
    { id: 5, type: 'info', msg: 'Mathura Cantt node recalibration successful.', time: '2 days ago' },
  ];

  return (
    <div className="max-w-4xl max-w-full">
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
             <button className="neu-btn p-4 shrink-0">
               <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="flex flex-col gap-8">
        <h3 className="display-font text-3xl font-bold text-[#0f172a]">Contact Support</h3>
        <div className="neu-flat p-10 flex flex-col gap-8">
           <div>
             <label className="block text-sm font-bold uppercase tracking-wider text-[#64748b] mb-4">Subject</label>
             <input type="text" className="w-full neu-pressed px-6 py-5 outline-none font-bold text-[#0f172a]" placeholder="How can we help?" />
           </div>
           <div>
             <label className="block text-sm font-bold uppercase tracking-wider text-[#64748b] mb-4">Message</label>
             <textarea rows="6" className="w-full neu-pressed px-6 py-5 outline-none font-medium custom-scrollbar text-[#0f172a] resize-none" placeholder="Describe your issue in detail..."></textarea>
           </div>
           <button className="neu-btn w-full py-5 font-bold text-lg text-primary flex items-center justify-center gap-2">
             <Send className="w-5 h-5" /> Send Message
           </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-8">
        <h3 className="display-font text-3xl font-bold text-[#0f172a]">FAQ</h3>
        {[
          "How often does the sensor calibrate?",
          "What is the battery replacement cycle?",
          "How to interpret AQI metrics?"
        ].map((q, i) => (
          <div key={i} className="neu-flat p-8 cursor-pointer hover:text-primary transition-colors">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-[#0f172a]">{q}</span>
              <ChevronDownIcon />
            </div>
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

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`neu-btn flex items-center xl:gap-5 px-4 xl:px-6 py-5 cursor-pointer text-[#475569] font-semibold w-16 xl:w-full justify-center xl:justify-start ${active ? 'active text-primary' : ''}`}>
      <span className={`${active ? 'text-primary' : 'text-[#64748b]'} flex-shrink-0 w-6 h-6 flex justify-center items-center`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
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
  return (
    <div className="flex items-center justify-between py-3 cursor-pointer" onClick={() => setIsOn(!isOn)}>
      <span className="font-bold text-[#475569] text-lg">{label}</span>
      <div className={`w-16 h-9 rounded-full flex items-center p-1 transition-colors duration-300 shadow-inner ${isOn ? 'neu-pressed' : 'neu-flat'}`}>
        <motion.div 
          className={`w-7 h-7 rounded-full shadow-md ${isOn ? 'bg-primary' : 'bg-[#94a3b8]'}`}
          animate={{ x: isOn ? 28 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
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

function StatusBadge({ status }) {
  const getColors = () => {
    switch(status.toLowerCase()) {
      case 'online': return 'text-success bg-success/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'offline': return 'text-danger bg-danger/10';
      default: return 'text-[#94a3b8] bg-[#94a3b8]/10';
    }
  };
  return (
    <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest ${getColors()} neu-pressed-sm`}>
      {status}
    </span>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
