import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [aqiData, setAqiData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Soil states
  const [soilPh, setSoilPh] = useState<string>('');
  const [soilMoisture, setSoilMoisture] = useState<string>('');
  const [soilResult, setSoilResult] = useState<any>(null);

  useEffect(() => {
    if (location) {
      fetch(`http://localhost:8000/air/aqi?lat=${location.coords.latitude}&lon=${location.coords.longitude}`)
        .then(res => res.json())
        .then(data => setAqiData(data))
        .catch(err => console.error("AQI Fetch Error:", err));
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
        body: JSON.stringify({ 
          ph: parseFloat(soilPh) || 7.0, 
          moisture: parseFloat(soilMoisture) || 50.0, 
          soil_type: 'Loam' 
        })
      });
      setSoilResult(await response.json());
    } catch (error) {
      Alert.alert('Soil Analysis Failed', 'Could not connect to API.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.header}>
        <View style={styles.hubWidget}>
           <Text style={styles.hubText}>ORBITAL HUB: V3.FINAL</Text>
        </View>
        <View style={styles.syncWidget}>
           <Text style={styles.syncText}>Sync: 0.002ms</Text>
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* Left Side: Earth Visual & Soil Form */}
        <View style={styles.earthContainer}>
          <View style={styles.earthMock}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.earthImage} />
            ) : (
              <Text style={styles.earthMockText}>[ EARTH 3D RENDER ]</Text>
            )}
          </View>
          <TouchableOpacity style={styles.btnCapture} onPress={handleCapture}>
            <Text style={styles.btnText}>INITIATE PLANETARY SCAN</Text>
          </TouchableOpacity>

          {/* Soil Input Form */}
          <View style={styles.soilForm}>
             <Text style={styles.formTitle}>MANUAL SOIL OVERRIDE</Text>
             <View style={{flexDirection: 'row', gap: 10}}>
               <TextInput 
                 style={styles.input} 
                 placeholder="pH (e.g. 6.5)" 
                 placeholderTextColor="#4A5B7A"
                 value={soilPh}
                 onChangeText={setSoilPh}
               />
               <TextInput 
                 style={styles.input} 
                 placeholder="Moisture %" 
                 placeholderTextColor="#4A5B7A"
                 value={soilMoisture}
                 onChangeText={setSoilMoisture}
               />
               <TouchableOpacity style={styles.btnAnalyzeSmall} onPress={handleSoilAnalyze}>
                 <Text style={styles.btnTextSmall}>SOILSENSE</Text>
               </TouchableOpacity>
             </View>
          </View>
        </View>

        {/* Right Side: Data Panels */}
        <View style={styles.dataPanels}>
          {aqiData && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>AIRTRACE MODULE</Text>
              <Text style={styles.panelData}>AQI: {aqiData.aqi}</Text>
              <Text style={[styles.panelSub, {color: aqiData.aqi > 100 ? '#F44336' : '#00E5FF'}]}>
                STATUS: {aqiData.status.toUpperCase()}
              </Text>
            </View>
          )}

          {location && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>GEOLOCATION LINK</Text>
              <Text style={styles.panelData}>LAT: {location.coords.latitude.toFixed(4)}</Text>
              <Text style={styles.panelData}>LON: {location.coords.longitude.toFixed(4)}</Text>
            </View>
          )}

          {soilResult && (
             <View style={[styles.panel, { borderColor: soilResult.status === 'Optimal' ? '#00E5FF' : '#FF9800' }]}>
               <Text style={styles.panelTitle}>SOILSENSE DIAGNOSTICS</Text>
               <Text style={styles.panelData}>SCORE: {soilResult.soil_score}/100</Text>
               <Text style={styles.panelSub}>STATUS: {soilResult.status.toUpperCase()}</Text>
               <Text style={{color: '#8A99B5', fontSize: 10, marginTop: 5}}>{soilResult.recommendation}</Text>
             </View>
          )}

          {imageUri && !analysisResult && (
             <TouchableOpacity style={styles.btnAnalyze} onPress={handleAnalyze}>
               <Text style={styles.btnText}>RUN PLANTTALK ANALYSIS</Text>
             </TouchableOpacity>
          )}

          {analysisResult && (
            <View style={[styles.panel, { borderColor: analysisResult.phi_score > 70 ? '#00E5FF' : '#FF9800' }]}>
              <Text style={styles.panelTitle}>PLANTTALK DIAGNOSTICS</Text>
              <Text style={styles.panelData}>PHI SCORE: {analysisResult.phi_score}/100</Text>
              <Text style={styles.panelSub}>STATUS: {analysisResult.status.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom HUD */}
      <View style={styles.footer}>
         <View style={styles.pulseWidget}>
            <Text style={styles.pulseText}>⚡ Urban Pulse Active</Text>
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
  earthMock: { width: 300, height: 300, borderRadius: 150, backgroundColor: '#050D20', borderWidth: 2, borderColor: '#003366', justifyContent: 'center', alignItems: 'center', shadowColor: '#0055FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 50, elevation: 10, overflow: 'hidden' },
  earthImage: { width: '100%', height: '100%', opacity: 0.8 },
  earthMockText: { color: '#00E5FF', fontWeight: 'bold', opacity: 0.5 },
  btnCapture: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8 },
  
  soilForm: { marginTop: 30, padding: 15, backgroundColor: 'rgba(10, 15, 30, 0.8)', borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', alignItems: 'center' },
  formTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  input: { backgroundColor: '#02050A', color: '#00E5FF', borderWidth: 1, borderColor: '#1A233A', padding: 8, borderRadius: 5, width: 100, textAlign: 'center' },
  btnAnalyzeSmall: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF', padding: 10, borderRadius: 5, justifyContent: 'center' },
  btnTextSmall: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold' },

  btnAnalyze: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderWidth: 1, borderColor: '#FFC107', borderRadius: 8, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1 },
  
  dataPanels: { flex: 1, paddingLeft: 40 },
  panel: { backgroundColor: 'rgba(10, 15, 30, 0.8)', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', marginBottom: 15 },
  panelTitle: { color: '#4A5B7A', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  panelData: { color: '#FFF', fontSize: 20, fontWeight: '300', marginBottom: 5 },
  panelSub: { color: '#00E5FF', fontSize: 14, fontWeight: 'bold' },

  footer: { flexDirection: 'row', marginTop: 20 },
  pulseWidget: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#FFC107', backgroundColor: 'rgba(255, 193, 7, 0.05)' },
  pulseText: { color: '#FFC107', fontWeight: 'bold', fontSize: 12 }
});
