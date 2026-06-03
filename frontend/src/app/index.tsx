import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ScrollView, Switch, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Detect web platform
const isWeb = Platform.OS === 'web';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Aggregate Data
  const [aggregateData, setAggregateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Layer Controls
  const [layers, setLayers] = useState({ air: true, water: true, plants: true, soils: true });

  // Local Analysis
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [soilPh, setSoilPh] = useState<string>('');
  const [soilMoisture, setSoilMoisture] = useState<string>('');
  const [soilResult, setSoilResult] = useState<any>(null);

  // --- Fetch aggregate from backend ---
  const fetchAggregate = async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/aggregate?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setAggregateData(data);
    } catch {
      Alert.alert('Backend Error', 'Cannot reach backend at localhost:8000. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Pick Image from gallery (works on web + mobile) ---
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  // --- Demo Mode: load mock location + fetch all data ---
  const handleDemoMode = async () => {
    const mockLat = 12.9716;
    const mockLon = 77.5946; // Bengaluru
    setLocation({ latitude: mockLat, longitude: mockLon });
    await fetchAggregate(mockLat, mockLon);
  };

  // --- Browser native geolocation (works on HTTP localhost in Chrome) ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Alert.alert('Not Supported', 'Geolocation not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ latitude: lat, longitude: lon });
        await fetchAggregate(lat, lon);
      },
      () => {
        Alert.alert('Location Denied', 'Using demo location (Bengaluru) instead.');
        handleDemoMode();
      }
    );
  };

  // --- Plant Analysis ---
  const handleAnalyze = async () => {
    if (!imageUri) return;
    try {
      const formData = new FormData();
      // On web, fetch the blob from the data URL
      if (isWeb && imageUri.startsWith('data:')) {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'plant.jpg');
      } else {
        formData.append('file', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as any);
      }
      const response = await fetch('http://localhost:8000/plant/analyze', { method: 'POST', body: formData });
      setAnalysisResult(await response.json());
    } catch {
      Alert.alert('Analysis Failed', 'Could not connect to backend.');
    }
  };

  // --- Soil Analysis ---
  const handleSoilAnalyze = async () => {
    if (!soilPh || !soilMoisture) {
      Alert.alert('Input Required', 'Please enter pH and Moisture values.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/soil/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph: parseFloat(soilPh), moisture: parseFloat(soilMoisture), soil_type: 'Loam' })
      });
      setSoilResult(await response.json());
    } catch {
      Alert.alert('Soil Analysis Failed', 'Could not connect to backend.');
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));

  const getStatusColor = (status: string) => {
    if (['Healthy', 'Good', 'Pristine', 'Optimal'].includes(status)) return '#00E5FF';
    if (['Moderate', 'Fair', 'Marginal'].includes(status)) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.header}>
        <View style={styles.hubWidget}>
          <Text style={styles.hubText}>🛰 ORBITAL HUB: V4.TACTICAL</Text>
        </View>
        <View style={styles.syncWidget}>
          <Text style={styles.syncText}>
            {isLoading ? '⏳ SYNCING...' : aggregateData ? '🟢 ONLINE' : '⚪ AWAITING SCAN'}
          </Text>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Left Side: Earth + Controls */}
        <View style={styles.earthContainer}>
          <View style={styles.earthMock}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.earthImage} />
            ) : (
              <Text style={styles.earthMockText}>[ EARTH TACTICAL GRID ]</Text>
            )}
            {/* Tactical dot overlays */}
            {aggregateData && layers.plants && aggregateData.map_markers?.plants?.map((p: any, i: number) => (
              <View key={`p-${i}`} style={[styles.marker, { left: 60 + i * 60, top: 80 + (i % 2) * 50, backgroundColor: getStatusColor(p.status) }]} />
            ))}
            {aggregateData && layers.soils && aggregateData.map_markers?.soils?.map((s: any, i: number) => (
              <View key={`s-${i}`} style={[styles.markerSquare, { left: 80 + i * 70, top: 160 + (i % 2) * 30, backgroundColor: s.score > 70 ? '#00E5FF' : '#FF9800' }]} />
            ))}
            {aggregateData && layers.air && aggregateData.air && (
              <View style={[styles.airOverlay, { backgroundColor: getStatusColor(aggregateData.air.status) }]} />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnCapture} onPress={handleGetLocation}>
              <Text style={styles.btnText}>📡 GET LOCATION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnCapture, { borderColor: '#FFC107' }]} onPress={handleDemoMode}>
              <Text style={[styles.btnText, { color: '#FFC107' }]}>⚡ DEMO MODE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btnCapture, { marginTop: 10, width: 300 }]} onPress={handlePickImage}>
            <Text style={styles.btnText}>🌿 UPLOAD PLANT IMAGE</Text>
          </TouchableOpacity>

          {/* Location info */}
          {location && (
            <Text style={styles.locText}>
              📍 LAT: {location.latitude.toFixed(4)} | LON: {location.longitude.toFixed(4)}
            </Text>
          )}

          {/* Layer Toggles */}
          {aggregateData && (
            <View style={styles.layerControls}>
              <Text style={styles.formTitle}>TACTICAL OVERLAYS</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>AirTrace</Text>
                <Switch value={layers.air} onValueChange={() => toggleLayer('air')} thumbColor="#00E5FF" trackColor={{ true: 'rgba(0,229,255,0.3)', false: '#1A233A' }} />
                <Text style={styles.switchLabel}>RiverPulse</Text>
                <Switch value={layers.water} onValueChange={() => toggleLayer('water')} thumbColor="#00E5FF" trackColor={{ true: 'rgba(0,229,255,0.3)', false: '#1A233A' }} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>PlantTalk</Text>
                <Switch value={layers.plants} onValueChange={() => toggleLayer('plants')} thumbColor="#00E5FF" trackColor={{ true: 'rgba(0,229,255,0.3)', false: '#1A233A' }} />
                <Text style={styles.switchLabel}>SoilSense</Text>
                <Switch value={layers.soils} onValueChange={() => toggleLayer('soils')} thumbColor="#00E5FF" trackColor={{ true: 'rgba(0,229,255,0.3)', false: '#1A233A' }} />
              </View>
            </View>
          )}
        </View>

        {/* Right Side: Data Panels */}
        <ScrollView style={styles.dataPanels} showsVerticalScrollIndicator={false}>

          {/* PlantTalk */}
          {layers.plants && imageUri && !analysisResult && (
            <TouchableOpacity style={styles.btnAnalyze} onPress={handleAnalyze}>
              <Text style={styles.btnText}>🌱 RUN PLANTTALK ANALYSIS</Text>
            </TouchableOpacity>
          )}
          {layers.plants && analysisResult && (
            <View style={[styles.panel, { borderColor: getStatusColor(analysisResult.status) }]}>
              <Text style={styles.panelTitle}>PLANTTALK DIAGNOSTICS</Text>
              <Text style={styles.panelData}>PHI: {analysisResult.phi_score}/100</Text>
              <Text style={[styles.panelSub, { color: getStatusColor(analysisResult.status) }]}>
                {analysisResult.status.toUpperCase()}
              </Text>
            </View>
          )}

          {/* AirTrace */}
          {layers.air && aggregateData?.air && (
            <View style={[styles.panel, { borderColor: getStatusColor(aggregateData.air.status) }]}>
              <Text style={styles.panelTitle}>AIRTRACE MODULE</Text>
              <Text style={styles.panelData}>AQI: {aggregateData.air.aqi}</Text>
              <Text style={[styles.panelSub, { color: getStatusColor(aggregateData.air.status) }]}>
                {aggregateData.air.status.toUpperCase()}
              </Text>
              <Text style={styles.providerText}>via {aggregateData.air.provider}</Text>
            </View>
          )}

          {/* RiverPulse */}
          {layers.water && aggregateData?.water && (
            <View style={[styles.panel, { borderColor: getStatusColor(aggregateData.water.status) }]}>
              <Text style={styles.panelTitle}>RIVERPULSE MODULE</Text>
              <Text style={styles.panelData}>SCORE: {aggregateData.water.score}/100</Text>
              <Text style={[styles.panelSub, { color: getStatusColor(aggregateData.water.status) }]}>
                {aggregateData.water.status.toUpperCase()}
              </Text>
              <View style={styles.metricsRow}>
                <Text style={styles.metricText}>pH: {aggregateData.water.metrics.ph}</Text>
                <Text style={styles.metricText}>DO: {aggregateData.water.metrics.do_mgl}mg/L</Text>
                <Text style={styles.metricText}>Turb: {aggregateData.water.metrics.turbidity_ntu}NTU</Text>
              </View>
            </View>
          )}

          {/* SoilSense */}
          {layers.soils && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>SOILSENSE MODULE</Text>
              <View style={styles.soilRow}>
                <TextInput
                  style={styles.input}
                  placeholder="pH (e.g. 6.5)"
                  placeholderTextColor="#4A5B7A"
                  keyboardType="numeric"
                  value={soilPh}
                  onChangeText={setSoilPh}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Moisture %"
                  placeholderTextColor="#4A5B7A"
                  keyboardType="numeric"
                  value={soilMoisture}
                  onChangeText={setSoilMoisture}
                />
                <TouchableOpacity style={styles.btnSmall} onPress={handleSoilAnalyze}>
                  <Text style={styles.btnTextSmall}>ANALYZE</Text>
                </TouchableOpacity>
              </View>
              {soilResult && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.panelData}>SCORE: {soilResult.soil_score}/100</Text>
                  <Text style={[styles.panelSub, { color: getStatusColor(soilResult.status) }]}>
                    {soilResult.status.toUpperCase()}
                  </Text>
                  <Text style={styles.metricText}>{soilResult.recommendation}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom HUD */}
      <View style={styles.footer}>
        <View style={styles.pulseWidget}>
          <Text style={styles.pulseText}>⚡ Planetary Grid Active — Phases 1-7 Complete</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: 'transparent', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hubWidget: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.05)' },
  hubText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1, fontSize: 13 },
  syncWidget: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#1A233A', backgroundColor: 'rgba(26,35,58,0.5)' },
  syncText: { color: '#8A99B5', fontSize: 12 },
  contentArea: { flex: 1, flexDirection: 'row', marginTop: 18 },
  earthContainer: { flex: 1.5, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10 },
  earthMock: { width: 280, height: 280, borderRadius: 140, backgroundColor: '#050D20', borderWidth: 2, borderColor: '#003366', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: '#0055FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 40 },
  earthImage: { width: '100%', height: '100%', opacity: 0.85 },
  earthMockText: { color: '#00E5FF', fontWeight: 'bold', opacity: 0.4, fontSize: 13 },
  marker: { position: 'absolute', width: 10, height: 10, borderRadius: 5, elevation: 5 },
  markerSquare: { position: 'absolute', width: 10, height: 10, elevation: 5 },
  airOverlay: { position: 'absolute', width: '100%', height: '100%', opacity: 0.08 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCapture: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8 },
  btnText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 0.8, fontSize: 12 },
  locText: { color: '#8A99B5', fontSize: 11, marginTop: 10 },
  layerControls: { marginTop: 18, padding: 14, backgroundColor: 'rgba(10,15,30,0.9)', borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', width: 290 },
  formTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  switchLabel: { color: '#8A99B5', fontSize: 12, fontWeight: '600' },
  dataPanels: { flex: 1, paddingLeft: 28 },
  panel: { backgroundColor: 'rgba(10,15,30,0.85)', padding: 18, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', marginBottom: 14 },
  panelTitle: { color: '#4A5B7A', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  panelData: { color: '#FFF', fontSize: 22, fontWeight: '300', marginBottom: 4 },
  panelSub: { color: '#00E5FF', fontSize: 13, fontWeight: 'bold' },
  providerText: { color: '#4A5B7A', fontSize: 10, marginTop: 5 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metricText: { color: '#8A99B5', fontSize: 11 },
  soilRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#02050A', color: '#00E5FF', borderWidth: 1, borderColor: '#1A233A', padding: 8, borderRadius: 6, fontSize: 12 },
  btnSmall: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: '#00E5FF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6 },
  btnTextSmall: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold' },
  btnAnalyze: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: 'rgba(255,193,7,0.08)', borderWidth: 1, borderColor: '#FFC107', borderRadius: 8, marginBottom: 14, alignItems: 'center' },
  footer: { marginTop: 16 },
  pulseWidget: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.04)', alignSelf: 'flex-start' },
  pulseText: { color: '#00E5FF', fontWeight: 'bold', fontSize: 11 }
});
