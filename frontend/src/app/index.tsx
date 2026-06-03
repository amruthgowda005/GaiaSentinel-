import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ScrollView, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  // Aggregate Data
  const [aggregateData, setAggregateData] = useState<any>(null);
  
  // Layer Controls
  const [layers, setLayers] = useState({
    air: true,
    water: true,
    plants: true,
    soils: true
  });

  // Local Analysis
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [soilPh, setSoilPh] = useState<string>('');
  const [soilMoisture, setSoilMoisture] = useState<string>('');
  const [soilResult, setSoilResult] = useState<any>(null);

  useEffect(() => {
    if (location) {
      fetch(`http://localhost:8000/aggregate?lat=${location.coords.latitude}&lon=${location.coords.longitude}`)
        .then(res => res.json())
        .then(data => setAggregateData(data))
        .catch(err => console.error("Aggregate Fetch Error:", err));
    }
  }, [location]);

  const handleCapture = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (cameraStatus !== 'granted' || locStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and Location required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAnalysisResult(null); 
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    try {
      const formData = new FormData();
      formData.append('file', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as any);
      const response = await fetch('http://localhost:8000/plant/analyze', { method: 'POST', body: formData });
      setAnalysisResult(await response.json());
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not connect to the ML API.');
    }
  };

  const handleSoilAnalyze = async () => {
    try {
      const response = await fetch('http://localhost:8000/soil/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph: parseFloat(soilPh) || 7.0, moisture: parseFloat(soilMoisture) || 50.0, soil_type: 'Loam' })
      });
      setSoilResult(await response.json());
    } catch (error) {
      Alert.alert('Soil Analysis Failed', 'Could not connect to API.');
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getStatusColor = (status: string) => {
    if (status === 'Healthy' || status === 'Good' || status === 'Pristine' || status === 'Optimal') return '#00E5FF';
    if (status === 'Moderate' || status === 'Fair' || status === 'Marginal') return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.header}>
        <View style={styles.hubWidget}>
           <Text style={styles.hubText}>ORBITAL HUB: V4.TACTICAL</Text>
        </View>
        <View style={styles.syncWidget}>
           <Text style={styles.syncText}>Sync: {aggregateData ? 'ONLINE' : 'AWAITING SCAN'}</Text>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Left Side: Earth Tactical Grid */}
        <View style={styles.earthContainer}>
          <View style={styles.earthMock}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.earthImage} />
            ) : (
              <Text style={styles.earthMockText}>[ EARTH 3D RENDER ]</Text>
            )}

            {/* Tactical Overlays */}
            {aggregateData && layers.plants && aggregateData.map_markers.plants.map((p: any) => (
              <View key={`p-${p.id}`} style={[styles.marker, { left: 150 + (p.lon - location!.coords.longitude)*1000, top: 150 + (p.lat - location!.coords.latitude)*1000, backgroundColor: getStatusColor(p.status) }]} />
            ))}
            {aggregateData && layers.soils && aggregateData.map_markers.soils.map((s: any) => (
              <View key={`s-${s.id}`} style={[styles.markerSquare, { left: 150 + (s.lon - location!.coords.longitude)*1000, top: 150 + (s.lat - location!.coords.latitude)*1000, backgroundColor: s.score > 70 ? '#00E5FF' : '#FF9800' }]} />
            ))}
            {aggregateData && layers.air && (
              <View style={[styles.airOverlay, { backgroundColor: getStatusColor(aggregateData.air.status) }]} />
            )}
          </View>

          <TouchableOpacity style={styles.btnCapture} onPress={handleCapture}>
            <Text style={styles.btnText}>INITIATE PLANETARY SCAN</Text>
          </TouchableOpacity>

          {/* Layer Controls */}
          {aggregateData && (
            <View style={styles.layerControls}>
              <Text style={styles.formTitle}>TACTICAL OVERLAYS</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>AirTrace</Text>
                <Switch value={layers.air} onValueChange={() => toggleLayer('air')} thumbColor="#00E5FF" trackColor={{true: 'rgba(0, 229, 255, 0.3)'}} />
                <Text style={styles.switchLabel}>RiverPulse</Text>
                <Switch value={layers.water} onValueChange={() => toggleLayer('water')} thumbColor="#00E5FF" trackColor={{true: 'rgba(0, 229, 255, 0.3)'}} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>PlantTalk</Text>
                <Switch value={layers.plants} onValueChange={() => toggleLayer('plants')} thumbColor="#00E5FF" trackColor={{true: 'rgba(0, 229, 255, 0.3)'}} />
                <Text style={styles.switchLabel}>SoilSense</Text>
                <Switch value={layers.soils} onValueChange={() => toggleLayer('soils')} thumbColor="#00E5FF" trackColor={{true: 'rgba(0, 229, 255, 0.3)'}} />
              </View>
            </View>
          )}
        </View>

        {/* Right Side: Data Panels */}
        <ScrollView style={styles.dataPanels} showsVerticalScrollIndicator={false}>
          {aggregateData && layers.air && (
            <View style={[styles.panel, { borderColor: getStatusColor(aggregateData.air.status) }]}>
              <Text style={styles.panelTitle}>AIRTRACE MODULE</Text>
              <Text style={styles.panelData}>AQI: {aggregateData.air.aqi}</Text>
              <Text style={[styles.panelSub, {color: getStatusColor(aggregateData.air.status)}]}>STATUS: {aggregateData.air.status.toUpperCase()}</Text>
            </View>
          )}

          {aggregateData && layers.water && (
             <View style={[styles.panel, { borderColor: getStatusColor(aggregateData.water.status) }]}>
               <Text style={styles.panelTitle}>RIVERPULSE MODULE</Text>
               <Text style={styles.panelData}>SCORE: {aggregateData.water.score}/100</Text>
               <Text style={[styles.panelSub, {color: getStatusColor(aggregateData.water.status)}]}>STATUS: {aggregateData.water.status.toUpperCase()}</Text>
               <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                 <Text style={{color: '#8A99B5', fontSize: 10}}>pH: {aggregateData.water.metrics.ph}</Text>
                 <Text style={{color: '#8A99B5', fontSize: 10}}>DO: {aggregateData.water.metrics.do_mgl}mg/L</Text>
                 <Text style={{color: '#8A99B5', fontSize: 10}}>Turbidity: {aggregateData.water.metrics.turbidity_ntu}NTU</Text>
               </View>
             </View>
          )}

          {aggregateData && layers.soils && (
            <View style={styles.panel}>
              <Text style={styles.formTitle}>SOILSENSE OVERRIDE</Text>
              <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                <TextInput style={styles.input} placeholder="pH" placeholderTextColor="#4A5B7A" value={soilPh} onChangeText={setSoilPh} />
                <TextInput style={styles.input} placeholder="Moist %" placeholderTextColor="#4A5B7A" value={soilMoisture} onChangeText={setSoilMoisture} />
                <TouchableOpacity style={styles.btnAnalyzeSmall} onPress={handleSoilAnalyze}>
                  <Text style={styles.btnTextSmall}>ANALYZE</Text>
                </TouchableOpacity>
              </View>
              {soilResult && (
                <View style={{marginTop: 15}}>
                  <Text style={[styles.panelSub, {color: getStatusColor(soilResult.status)}]}>SCORE: {soilResult.soil_score} ({soilResult.status.toUpperCase()})</Text>
                  <Text style={{color: '#8A99B5', fontSize: 10, marginTop: 5}}>{soilResult.recommendation}</Text>
                </View>
              )}
            </View>
          )}

          {aggregateData && layers.plants && imageUri && !analysisResult && (
             <TouchableOpacity style={styles.btnAnalyze} onPress={handleAnalyze}>
               <Text style={styles.btnText}>RUN PLANTTALK ANALYSIS</Text>
             </TouchableOpacity>
          )}

          {aggregateData && layers.plants && analysisResult && (
            <View style={[styles.panel, { borderColor: getStatusColor(analysisResult.status) }]}>
              <Text style={styles.panelTitle}>PLANTTALK DIAGNOSTICS</Text>
              <Text style={styles.panelData}>PHI SCORE: {analysisResult.phi_score}/100</Text>
              <Text style={[styles.panelSub, {color: getStatusColor(analysisResult.status)}]}>STATUS: {analysisResult.status.toUpperCase()}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
         <View style={styles.pulseWidget}>
            <Text style={styles.pulseText}>⚡ Planetary Grid Active</Text>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  hubWidget: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.05)' },
  hubText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1 },
  syncWidget: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1A233A', backgroundColor: 'rgba(26, 35, 58, 0.5)' },
  syncText: { color: '#8A99B5', fontSize: 12 },
  
  contentArea: { flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  earthContainer: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  earthMock: { width: 300, height: 300, borderRadius: 150, backgroundColor: '#050D20', borderWidth: 2, borderColor: '#003366', justifyContent: 'center', alignItems: 'center', shadowColor: '#0055FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 50, elevation: 10, overflow: 'hidden', position: 'relative' },
  earthImage: { width: '100%', height: '100%', opacity: 0.8 },
  earthMockText: { color: '#00E5FF', fontWeight: 'bold', opacity: 0.5 },
  
  marker: { position: 'absolute', width: 8, height: 8, borderRadius: 4, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 5 },
  markerSquare: { position: 'absolute', width: 8, height: 8, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 5 },
  airOverlay: { position: 'absolute', width: '100%', height: '100%', opacity: 0.1 },

  btnCapture: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8 },
  
  layerControls: { marginTop: 20, padding: 15, backgroundColor: 'rgba(10, 15, 30, 0.8)', borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', width: 300 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  switchLabel: { color: '#8A99B5', fontSize: 12, fontWeight: 'bold' },

  input: { backgroundColor: '#02050A', color: '#00E5FF', borderWidth: 1, borderColor: '#1A233A', padding: 8, borderRadius: 5, flex: 1, textAlign: 'center' },
  btnAnalyzeSmall: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF', padding: 10, borderRadius: 5, justifyContent: 'center' },
  btnTextSmall: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold' },

  btnAnalyze: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderWidth: 1, borderColor: '#FFC107', borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  btnText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1 },
  
  dataPanels: { flex: 1, paddingLeft: 40 },
  panel: { backgroundColor: 'rgba(10, 15, 30, 0.8)', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', marginBottom: 15 },
  panelTitle: { color: '#4A5B7A', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  formTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  panelData: { color: '#FFF', fontSize: 20, fontWeight: '300', marginBottom: 5 },
  panelSub: { color: '#00E5FF', fontSize: 14, fontWeight: 'bold' },

  footer: { flexDirection: 'row', marginTop: 20 },
  pulseWidget: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.05)' },
  pulseText: { color: '#00E5FF', fontWeight: 'bold', fontSize: 12 }
});
