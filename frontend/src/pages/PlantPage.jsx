import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Trash2, ChevronRight, Activity, Leaf } from 'lucide-react';

export default function PlantPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    const saved = JSON.parse(localStorage.getItem('gaia_phi_history') || '[]');
    setHistory(saved);
  }, []);

  const saveToHistory = (newResult) => {
    const newEntry = {
      ...newResult,
      timestamp: new Date().toLocaleString(),
      id: Date.now()
    };
    const updated = [newEntry, ...history].slice(0, 10); // Keep last 10
    setHistory(updated);
    localStorage.setItem('gaia_phi_history', JSON.stringify(updated));
  };

  const resetAnalysis = () => {
    setResult(null);
    setImage(null);
    setPreview(null);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      alert("Could not access camera. Check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setImage(file);
        setPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyzePlant = async () => {
    if (!image) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', image);

    try {
      const res = await fetch('http://localhost:8000/api/plant/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      saveToHistory(data);
    } catch (err) {
      console.error("Analysis Error:", err);
      alert("Failed to connect to vision engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade">
      <header className="page-header narrow">
        <div className="module-tag">Module: PlantTalk</div>
        <h1 className="hero-title narrow">Photosynthetic <span className="accent">Health</span></h1>
        <p className="hero-sub narrow">Spectral analysis of foliage health and stress reasoning.</p>
      </header>

      <main className="section narrow">
        {!result ? (
          <div className="capture-container">
            {/* Camera / Preview Area */}
            <div className="viewport card">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="video-stream" />
              ) : preview ? (
                <img src={preview} alt="Preview" className="image-preview" />
              ) : (
                <div className="viewport-placeholder">
                  <Activity size={48} className="text-muted" />
                  <p>Ready to Scan</p>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            <div className="controls">
              {!isCameraActive && !preview && (
                 <button className="btn btn-primary" onClick={startCamera}>
                   <Camera size={20} /> Open Camera
                 </button>
              )}
              {isCameraActive && (
                <button className="btn btn-accent" onClick={captureImage}>Capture Frame</button>
              )}
              {!isCameraActive && !preview && (
                <label className="btn btn-secondary cursor-pointer">
                  <Upload size={20} /> Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
              {preview && !loading && (
                <div className="action-row">
                  <button className="btn btn-accent pulse" onClick={analyzePlant}>Start Analysis</button>
                  <button className="btn btn-danger" onClick={resetAnalysis}><Trash2 size={20} /></button>
                </div>
              )}
              {loading && <div className="loader">Analyzing Spectral Data...</div>}
            </div>
          </div>
        ) : (
          <div className="results-container page-fade">
            {/* The Analysis Result Card */}
            <div className="card result-card">
              <div className="phi-ring">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={`circle ${result.phi >= 80 ? 'green' : result.phi >= 50 ? 'yellow' : 'red'}`}
                    strokeDasharray={`${result.phi}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">{result.phi}</text>
                </svg>
                <div className="phi-label">PHI Index</div>
              </div>

              <div className="result-info">
                <h3 className={`status-tag ${result.phi >= 80 ? 'green-bg' : result.phi >= 50 ? 'yellow-bg' : 'red-bg'}`}>
                  {result.status}
                </h3>
                <h2 className="result-title">Ecological Insight</h2>
                <p className="result-text">{result.insight}</p>
                <button className="btn btn-secondary" onClick={resetAnalysis}>
                  <RefreshCw size={18} /> New Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length > 0 && (
          <div className="history-section page-fade">
            <h3 className="section-title">Telemetry History</h3>
            <div className="history-list">
              {history.map(item => (
                <div key={item.id} className="history-item">
                   <div className={`history-dot ${item.phi >= 80 ? 'green' : item.phi >= 50 ? 'yellow' : 'red'}`} />
                   <div className="history-main">
                      <span className="history-phi">{item.phi} PHI</span>
                      <span className="history-time">{item.timestamp}</span>
                   </div>
                   <div className="history-status">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
