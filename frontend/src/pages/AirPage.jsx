import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Wind, Activity, Timer, AlertCircle } from 'lucide-react';

export default function AirPage() {
  const [aqiData, setAqiData] = useState({ aqi: 0, category: 'Loading', color: '#6b7fa3' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAQI = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/air');
      const data = await res.json();
      setAqiData(data);
      
      const newEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: data.aqi,
        timestamp: Date.now()
      };
      
      const savedHistory = JSON.parse(localStorage.getItem('gaia_aqi_history') || '[]');
      const updatedHistory = [...savedHistory, newEntry].slice(-12); // Last 12 points
      setHistory(updatedHistory);
      localStorage.setItem('gaia_aqi_history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("AQI Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAQI();
    // Poll every 30 seconds for simulation
    const interval = setInterval(fetchAQI, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-fade">
      <header className="page-header narrow">
        <div className="module-tag">Module: AirTrace</div>
        <h1 className="hero-title narrow">Atmospheric <span className="accent">Quality</span></h1>
        <p className="hero-sub narrow">Real-time air health index and historical concentration trends.</p>
      </header>

      <main className="section narrow">
        {/* Core AQI Display */}
        <div className="grid">
          <div className="card aqi-hero-card" style={{ borderLeft: `4px solid ${aqiData.color}` }}>
             <div className="aqi-main">
                <span className="aqi-label">Current AQI</span>
                <span className="aqi-value" style={{ color: aqiData.color }}>{aqiData.aqi}</span>
                <span className="aqi-category" style={{ backgroundColor: `${aqiData.color}22`, color: aqiData.color }}>
                  {aqiData.category}
                </span>
             </div>
             <div className="aqi-meta">
                <div className="meta-item">
                   <Wind size={18} className="text-muted" />
                   <span>O₃: 42 ppb</span>
                </div>
                <div className="meta-item">
                   <Activity size={18} className="text-muted" />
                   <span>PM2.5: 12 µg/m³</span>
                </div>
             </div>
          </div>

          <div className="card stat-card">
             <h3 className="section-title">Health Advisory</h3>
             <div className="advisory-content">
               {aqiData.aqi <= 50 ? (
                 <p className="text-muted">Air quality is satisfactory. Enjoy outdoor activities.</p>
               ) : aqiData.aqi <= 100 ? (
                 <p className="text-warning">Moderate air quality. Sensitive individuals should monitor symptoms.</p>
               ) : (
                 <p className="text-danger">Poor air quality. Avoid prolonged outdoor exertion.</p>
               )}
             </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card chart-container">
           <h3 className="section-title">Historical Trends (12h)</h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={aqiData.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={aqiData.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" vertical={false} />
                  <XAxis dataKey="time" stroke="#6b7fa3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7fa3" fontSize={12} tickLine={false} axisLine={false} domain={[0, 200]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e1620', border: '1px solid #1a2840', borderRadius: '8px' }}
                    itemStyle={{ color: aqiData.color }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke={aqiData.color} 
                    fillOpacity={1} 
                    fill="url(#colorAqi)" 
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Information Grid */}
        <div className="card status-info-card">
           <div className="info-row">
              <AlertCircle size={20} className="text-accent" />
              <div>
                <h4>Telemetry Status</h4>
                <p className="text-muted">Node Gaia-AT7 connected. Synchronized via global mesh network.</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
