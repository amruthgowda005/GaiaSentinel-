import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aqiData, setAqiData] = useState<any>(null);

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
      Alert.alert('Permissions Required', 'Camera and Location permissions are required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAnalysisResult(null); 
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
  };

  const handleUpload = async () => {
    if (!imageUri || !location) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: imageUri, name: 'capture.jpg', type: 'image/jpeg' } as any);
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('timestamp', new Date(location.timestamp).toISOString());

      await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
      Alert.alert('Success', 'Data uploaded successfully!');
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not connect to backend.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as any);

      const response = await fetch('http://localhost:8000/plant/analyze', { method: 'POST', body: formData });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not connect to the ML API.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Healthy' || status === 'Good') return '#4CAF50';
    if (status === 'Moderate') return '#FF9800';
    return '#F44336';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gaia Sentinel Dashboard</Text>
      
      {aqiData && (
        <View style={[styles.aqiCard, { backgroundColor: getStatusColor(aqiData.status) }]}>
          <Text style={styles.aqiTitle}>Local Air Quality Index</Text>
          <Text style={styles.aqiValue}>{aqiData.aqi}</Text>
          <Text style={styles.aqiStatus}>{aqiData.status} ({aqiData.provider})</Text>
        </View>
      )}

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {location && (
            <Text style={styles.locText}>
              Loc: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
          )}

          {analysisResult && (
            <View style={[styles.analysisCard, { borderColor: getStatusColor(analysisResult.status) }]}>
              <Text style={styles.phiText}>PHI Score: {analysisResult.phi_score}/100</Text>
              <Text style={[styles.statusText, { color: getStatusColor(analysisResult.status) }]}>
                Status: {analysisResult.status}
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnAction} onPress={handleAnalyze} disabled={isAnalyzing}>
              <Text style={styles.btnText}>{isAnalyzing ? 'Analyzing...' : 'Analyze Plant'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnUpload} onPress={handleUpload} disabled={isUploading}>
              <Text style={styles.btnText}>{isUploading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => { setImageUri(null); setAqiData(null); setLocation(null); }}>
              <Text style={styles.btnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>[ Map Placeholder ]</Text>
          <TouchableOpacity style={styles.btnCapture} onPress={handleCapture}>
            <Text style={styles.btnText}>Capture Environmental Data</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#E8F5E9', padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 20 },
  aqiCard: { width: '100%', padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  aqiTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  aqiValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 5 },
  aqiStatus: { color: '#fff', fontSize: 14 },
  mapPlaceholder: { width: '100%', height: 350, backgroundColor: '#A5D6A7', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50' },
  mapText: { color: '#1B5E20', fontWeight: 'bold', marginBottom: 20 },
  btnCapture: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  previewContainer: { width: '100%', alignItems: 'center' },
  preview: { width: '100%', height: 250, borderRadius: 10, marginBottom: 10 },
  locText: { color: '#1B5E20', marginBottom: 15, fontWeight: '500' },
  analysisCard: { width: '100%', padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 2, marginBottom: 15, alignItems: 'center' },
  phiText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusText: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  btnRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btnAction: { backgroundColor: '#FF9800', padding: 12, borderRadius: 8 },
  btnUpload: { backgroundColor: '#1976D2', padding: 12, borderRadius: 8 },
  btnCancel: { backgroundColor: '#D32F2F', padding: 12, borderRadius: 8 }
});
