import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, Wind, Activity, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    phi: 0,
    phiStatus: 'Pending',
    aqi: 0,
    aqiStatus: 'Loading...',
    color: '#6b7fa3'
  });

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // 1. Fetch latest AQI
    fetch('http://localhost:8001/api/air')
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          aqi: data.aqi,
          aqiStatus: data.category,
          color: data.color
        }));

        // AQI Logic for Recommendation
        if (data.aqi > 150) {
           setRecommendations(prev => [...prev, {
             id: 'aqi-alert',
             type: 'warning',
             text: 'High Atmospheric Toxicity: Avoid outdoor physical activity.'
           }]);
        }
      })
      .catch(err => console.error("AQI Fetch Error:", err));

    // 2. Get latest PHI from localStorage
    const history = JSON.parse(localStorage.getItem('gaia_phi_history') || '[]');
    if (history.length > 0) {
      const latest = history[0];
      setStats(prev => ({
        ...prev,
        phi: latest.phi,
        phiStatus: latest.status
      }));

      // PHI Logic for Recommendation
      if (latest.phi < 50) {
         setRecommendations(prev => [...prev, {
           id: 'phi-alert',
           type: 'action',
           text: 'Low Plant PHI Detected: Increase watering and check for Heat Stress.'
         }]);
      }
    }
  }, []);

  return (
    <div className="page-fade">
      <header className="page-header">
        <h1 className="hero-title">Planetary <span className="accent">Intelligence</span></h1>
        <p className="hero-sub">Unified telemetry for localized ecological restoration.</p>
      </header>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
         <section className="recommendations-container page-fade">
           <h3 className="section-title">Critical Insight Suggestions</h3>
           <div className="recommendations-list">
             {recommendations.map(rec => (
               <div key={rec.id} className={`recommendation-card ${rec.type}`}>
                  <div className="rec-icon">
                    {rec.type === 'warning' ? <AlertTriangle size={20} className="text-danger" /> : <Activity size={20} className="text-warning" />}
                  </div>
                  <div className="rec-text">{rec.text}</div>
               </div>
             ))}
           </div>
         </section>
      )}

      <div className="grid">
        {/* Plant Health Card */}
        <NavLink to="/plant" className="card interactive-card">
          <div className="card-header">
            <Leaf className="card-icon-svg text-accent" />
            <span className="card-tag">PlantTalk V1</span>
          </div>
          <h2 className="card-name">Photosynthetic Health</h2>
          <div className="card-value">
            <span className="value-num">{stats.phi}</span>
            <span className="value-unit">PHI</span>
          </div>
          <div className="card-status" style={{ color: stats.phi >= 80 ? '#22d3a5' : stats.phi >= 50 ? '#fbbf24' : '#f87171' }}>
            ● {stats.phiStatus}
          </div>
          <div className="card-footer">
            <span>Analyze Sample</span>
            <ChevronRight size={16} />
          </div>
        </NavLink>

        {/* Air Quality Card */}
        <NavLink to="/air" className="card interactive-card">
          <div className="card-header">
            <Wind className="card-icon-svg" style={{ color: stats.color }} />
            <span className="card-tag">AirTrace V1</span>
          </div>
          <h2 className="card-name">Atmospheric Quality</h2>
          <div className="card-value">
            <span className="value-num">{stats.aqi}</span>
            <span className="value-unit">AQI</span>
          </div>
          <div className="card-status" style={{ color: stats.color }}>
            ● {stats.aqiStatus}
          </div>
          <div className="card-footer">
            <span>Detailed Trends</span>
            <ChevronRight size={16} />
          </div>
        </NavLink>

        {/* Systems Status */}
        <div className="card static-card gray-out">
          <div className="card-header">
            <CheckCircle className="card-icon-svg text-accent" />
            <span className="card-tag">Gaia Engine</span>
          </div>
          <h2 className="card-name">Processing Core</h2>
          <p className="card-desc">Monitoring 1,024 regional nodes. Status: Synchronized.</p>
          <div className="card-status status-good">● Stable</div>
        </div>
      </div>
    </div>
  );
}
