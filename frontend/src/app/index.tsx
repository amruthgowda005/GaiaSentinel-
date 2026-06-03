import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useModule } from './ModuleContext';

export default function HomeScreen() {
  const { activeModule, aggregateData, setAggregateData, location, setLocation } = useModule();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [soilPh, setSoilPh] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [soilResult, setSoilResult] = useState<any>(null);

  const fetchAggregate = async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/aggregate?lat=${lat}&lon=${lon}`);
      setAggregateData(await res.json());
    } catch {
      Alert.alert('Backend Error', 'Cannot reach backend at localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { handleDemoMode(); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        await fetchAggregate(latitude, longitude);
      },
      () => handleDemoMode()
    );
  };

  const handleDemoMode = async () => {
    const lat = 12.9716, lon = 77.5946;
    setLocation({ latitude: lat, longitude: lon });
    await fetchAggregate(lat, lon);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setAnalysisResult(null); }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    try {
      const formData = new FormData();
      if (imageUri.startsWith('data:')) {
        const blob = await (await fetch(imageUri)).blob();
        formData.append('file', blob, 'plant.jpg');
      } else {
        formData.append('file', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as any);
      }
      const res = await fetch('http://localhost:8000/plant/analyze', { method: 'POST', body: formData });
      setAnalysisResult(await res.json());
    } catch { Alert.alert('Failed', 'Could not connect to backend.'); }
  };

  const handleSoilAnalyze = async () => {
    if (!soilPh || !soilMoisture) { Alert.alert('Required', 'Enter pH and Moisture values.'); return; }
    try {
      const res = await fetch('http://localhost:8000/soil/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph: parseFloat(soilPh), moisture: parseFloat(soilMoisture), soil_type: 'Loam' })
      });
      setSoilResult(await res.json());
    } catch { Alert.alert('Failed', 'Could not reach backend.'); }
  };

  const color = (status: string) => {
    if (['Healthy', 'Good', 'Pristine', 'Optimal'].includes(status)) return '#00E5FF';
    if (['Moderate', 'Fair', 'Marginal'].includes(status)) return '#FF9800';
    return '#F44336';
  };

  // ─── CORE:COMMAND — Full-screen 3D Earth ────────────────────────────────────
  const renderCoreCommand = () => (
    <View style={styles.earthWrapper}>
      {Platform.OS === 'web' ? (
        // @ts-ignore – iframe is web-only
        <iframe
          src="/earth.html"
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#02050A' }}
          title="3D Earth"
        />
      ) : (
        <View style={styles.earthFallback}>
          <Text style={styles.earthFallbackText}>[ 3D EARTH — WEB ONLY ]</Text>
        </View>
      )}
    </View>
  );

  // ─── PLANTTALK ──────────────────────────────────────────────────────────────
  const renderPlantTalk = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleTitle}>🌱 PLANTTALK MODULE</Text>
      <Text style={styles.moduleSubtitle}>Upload a plant image to run PHI analysis</Text>

      <TouchableOpacity style={[styles.btn, { marginBottom: 20 }]} onPress={handlePickImage}>
        <Text style={styles.btnTxt}>📂 UPLOAD PLANT IMAGE</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

      {imageUri && !analysisResult && (
        <TouchableOpacity style={[styles.btn, { borderColor: '#FFC107', marginTop: 16 }]} onPress={handleAnalyze}>
          <Text style={[styles.btnTxt, { color: '#FFC107' }]}>🔬 ANALYZE PLANT HEALTH</Text>
        </TouchableOpacity>
      )}

      {analysisResult && (
        <View style={[styles.resultCard, { borderColor: color(analysisResult.status) }]}>
          <Text style={styles.resultTitle}>PLANT HEALTH INDEX</Text>
          <Text style={[styles.resultBig, { color: color(analysisResult.status) }]}>{analysisResult.phi_score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(analysisResult.status) }]}>{analysisResult.status.toUpperCase()}</Text>
          <View style={styles.phiBar}>
            <View style={[styles.phiFill, { width: `${analysisResult.phi_score}%` as any, backgroundColor: color(analysisResult.status) }]} />
          </View>
        </View>
      )}
    </View>
  );

  // ─── AIRTRACE ───────────────────────────────────────────────────────────────
  const renderAirTrace = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleTitle}>💨 AIRTRACE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Real-time Air Quality Index from Open-Meteo</Text>

      {!aggregateData && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btn} onPress={handleGetLocation}><Text style={styles.btnTxt}>📡 GET LOCATION</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { borderColor: '#FFC107' }]} onPress={handleDemoMode}><Text style={[styles.btnTxt, { color: '#FFC107' }]}>⚡ DEMO MODE</Text></TouchableOpacity>
        </View>
      )}

      {aggregateData?.air && (
        <View style={[styles.resultCard, { borderColor: color(aggregateData.air.status) }]}>
          <Text style={styles.resultTitle}>AIR QUALITY INDEX</Text>
          <Text style={[styles.resultBig, { color: color(aggregateData.air.status) }]}>{aggregateData.air.aqi}</Text>
          <Text style={[styles.resultStatus, { color: color(aggregateData.air.status) }]}>{aggregateData.air.status.toUpperCase()}</Text>
          <View style={styles.phiBar}>
            <View style={[styles.phiFill, { width: `${Math.min(aggregateData.air.aqi, 100)}%` as any, backgroundColor: color(aggregateData.air.status) }]} />
          </View>
          <Text style={styles.metaText}>Source: {aggregateData.air.provider}</Text>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.scaleTitle}>AQI SCALE</Text>
            {[['0–50', 'Good', '#00E5FF'], ['51–100', 'Moderate', '#FF9800'], ['100+', 'Poor', '#F44336']].map(([range, label, c]) => (
              <View key={range} style={styles.scaleRow}>
                <View style={[styles.scaleColor, { backgroundColor: c as string }]} />
                <Text style={styles.scaleText}>{range} — {label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // ─── SOILSENSE ──────────────────────────────────────────────────────────────
  const renderSoilSense = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleTitle}>🪨 SOILSENSE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Manual soil health analysis</Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Soil pH</Text>
          <TextInput style={styles.textInput} placeholder="e.g. 6.5" placeholderTextColor="#4A5B7A"
            keyboardType="numeric" value={soilPh} onChangeText={setSoilPh} />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Moisture %</Text>
          <TextInput style={styles.textInput} placeholder="e.g. 45" placeholderTextColor="#4A5B7A"
            keyboardType="numeric" value={soilMoisture} onChangeText={setSoilMoisture} />
        </View>
        <TouchableOpacity style={[styles.btn, { marginTop: 10, alignSelf: 'flex-start' }]} onPress={handleSoilAnalyze}>
          <Text style={styles.btnTxt}>⚙️ RUN SOILSENSE SCAN</Text>
        </TouchableOpacity>
      </View>

      {soilResult && (
        <View style={[styles.resultCard, { borderColor: color(soilResult.status), marginTop: 24 }]}>
          <Text style={styles.resultTitle}>SOIL HEALTH SCORE</Text>
          <Text style={[styles.resultBig, { color: color(soilResult.status) }]}>{soilResult.soil_score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(soilResult.status) }]}>{soilResult.status.toUpperCase()}</Text>
          <View style={styles.phiBar}>
            <View style={[styles.phiFill, { width: `${soilResult.soil_score}%` as any, backgroundColor: color(soilResult.status) }]} />
          </View>
          <Text style={styles.metaText}>💡 {soilResult.recommendation}</Text>
        </View>
      )}
    </View>
  );

  // ─── RIVERPULSE ─────────────────────────────────────────────────────────────
  const renderRiverPulse = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleTitle}>💧 RIVERPULSE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Water quality telemetry via hydro sensor network</Text>

      {!aggregateData && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btn} onPress={handleGetLocation}><Text style={styles.btnTxt}>📡 GET LOCATION</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { borderColor: '#FFC107' }]} onPress={handleDemoMode}><Text style={[styles.btnTxt, { color: '#FFC107' }]}>⚡ DEMO MODE</Text></TouchableOpacity>
        </View>
      )}

      {aggregateData?.water && (
        <View style={[styles.resultCard, { borderColor: color(aggregateData.water.status) }]}>
          <Text style={styles.resultTitle}>WATER HEALTH SCORE</Text>
          <Text style={[styles.resultBig, { color: color(aggregateData.water.status) }]}>{aggregateData.water.score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(aggregateData.water.status) }]}>{aggregateData.water.status.toUpperCase()}</Text>
          <View style={styles.phiBar}>
            <View style={[styles.phiFill, { width: `${aggregateData.water.score}%` as any, backgroundColor: color(aggregateData.water.status) }]} />
          </View>
          <View style={styles.metricsGrid}>
            {[
              { label: 'pH Level', value: aggregateData.water.metrics.ph },
              { label: 'Dissolved O₂', value: `${aggregateData.water.metrics.do_mgl} mg/L` },
              { label: 'Turbidity', value: `${aggregateData.water.metrics.turbidity_ntu} NTU` },
            ].map(m => (
              <View key={m.label} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.metaText}>Source: {aggregateData.water.source}</Text>
        </View>
      )}
    </View>
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'PlantTalk':  return renderPlantTalk();
      case 'AirTrace':   return renderAirTrace();
      case 'SoilSense':  return renderSoilSense();
      case 'RiverPulse': return renderRiverPulse();
      default:           return renderCoreCommand();
    }
  };

  const isCore = activeModule === 'CORE:COMMAND';

  return (
    <View style={styles.container}>
      {/* Top HUD — only show on non-core modules */}
      {!isCore && (
        <View style={styles.topHud}>
          <View style={styles.hubWidget}>
            <Text style={styles.hubText}>🛰 ORBITAL HUB: V4.TACTICAL — {activeModule}</Text>
          </View>
          <View style={styles.syncWidget}>
            <Text style={styles.syncText}>{isLoading ? '⏳ SYNCING' : aggregateData ? '🟢 ONLINE' : '⚪ STANDBY'}</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {isCore ? (
        renderCoreCommand()
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {renderModule()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02050A' },

  // 3D Earth fills entire panel
  earthWrapper: { flex: 1, width: '100%', height: '100%' },
  earthFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  earthFallbackText: { color: '#00E5FF', opacity: 0.4 },

  topHud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A233A' },
  hubWidget: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.05)' },
  hubText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 0.8, fontSize: 12 },
  syncWidget: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#1A233A' },
  syncText: { color: '#8A99B5', fontSize: 11 },

  content: { padding: 30, paddingBottom: 60 },

  moduleContainer: { flex: 1 },
  moduleTitle: { color: '#00E5FF', fontSize: 22, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  moduleSubtitle: { color: '#8A99B5', fontSize: 13, marginBottom: 28 },

  previewImage: { width: '100%', maxWidth: 500, height: 260, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A' },

  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8, backgroundColor: 'rgba(0,229,255,0.06)' },
  btnTxt: { color: '#00E5FF', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.8 },

  resultCard: { backgroundColor: 'rgba(10,15,30,0.9)', padding: 24, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  resultTitle: { color: '#4A5B7A', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  resultBig: { fontSize: 52, fontWeight: '200', letterSpacing: 2 },
  resultStatus: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  phiBar: { height: 6, backgroundColor: '#1A233A', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  phiFill: { height: '100%', borderRadius: 3 },
  metaText: { color: '#4A5B7A', fontSize: 11, marginTop: 4 },

  scaleTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  scaleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  scaleColor: { width: 10, height: 10, borderRadius: 2, marginRight: 10 },
  scaleText: { color: '#8A99B5', fontSize: 12 },

  inputGroup: { backgroundColor: 'rgba(10,15,30,0.9)', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#1A233A' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  inputLabel: { color: '#8A99B5', fontSize: 13, width: 100, fontWeight: '600' },
  textInput: { flex: 1, backgroundColor: '#02050A', color: '#00E5FF', borderWidth: 1, borderColor: '#1A233A', padding: 10, borderRadius: 7, fontSize: 14 },

  metricsGrid: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 12 },
  metricBox: { flex: 1, backgroundColor: '#02050A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1A233A', alignItems: 'center' },
  metricLabel: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  metricValue: { color: '#00E5FF', fontSize: 16, fontWeight: '300' },
});
