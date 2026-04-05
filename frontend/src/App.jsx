import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutGrid, Leaf, Wind, ShieldCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PlantPage from './pages/PlantPage';
import AirPage from './pages/AirPage';
import './App.css';

function Nav() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
         <ShieldCheck size={28} className="text-accent" />
         <span className="brand-text">GaiaSentinel</span>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/plant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Leaf size={20} />
          <span>PlantTalk</span>
        </NavLink>
        <NavLink to="/air" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wind size={20} />
          <span>AirTrace</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot pulse-green" />
          <span>Network Active</span>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Nav />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plant" element={<PlantPage />} />
            <Route path="/air" element={<AirPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
