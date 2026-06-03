import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [aqiData, setAqiData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
        {/* Left Side: Earth Visual */}
        <View style={styles.earthContainer}>
          <View style={styles.earthMock}>
            {/* If there's an image, overlay it on the earth placeholder */}
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.earthImage} />
            ) : (
              <Text style={styles.earthMockText}>[ EARTH 3D RENDER ]</Text>
            )}
          </View>
          <TouchableOpacity style={styles.btnCapture} onPress={handleCapture}>
            <Text style={styles.btnText}>INITIATE PLANETARY SCAN</Text>
          </TouchableOpacity>
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
  earthMock: { width: 350, height: 350, borderRadius: 175, backgroundColor: '#050D20', borderWidth: 2, borderColor: '#003366', justifyContent: 'center', alignItems: 'center', shadowColor: '#0055FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 50, elevation: 10, overflow: 'hidden' },
  earthImage: { width: '100%', height: '100%', opacity: 0.8 },
  earthMockText: { color: '#00E5FF', fontWeight: 'bold', opacity: 0.5 },
  btnCapture: { marginTop: 40, paddingHorizontal: 30, paddingVertical: 15, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8 },
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
