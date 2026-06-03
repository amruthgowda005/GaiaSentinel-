import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = async () => {
    // Request permissions
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and Location permissions are required.');
      return;
    }

    // Capture Image
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      // Get Location
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
  };

  const handleUpload = async () => {
    if (!imageUri || !location) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'capture.jpg',
        type: 'image/jpeg'
      } as any);
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('timestamp', new Date(location.timestamp).toISOString());

      // Use a local IP address or 10.0.2.2 for Android emulator. For web, localhost works.
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      Alert.alert('Success', 'Environmental data captured & uploaded!');
      setImageUri(null);
      setLocation(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'Could not connect to backend.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gaia Sentinel Data Capture</Text>
      
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {location && (
            <Text style={styles.locText}>
              Loc: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnUpload} onPress={handleUpload} disabled={isUploading}>
              <Text style={styles.btnText}>{isUploading ? 'Uploading...' : 'Upload Data'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setImageUri(null)}>
              <Text style={styles.btnText}>Cancel</Text>
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
  mapPlaceholder: { width: '100%', height: 350, backgroundColor: '#A5D6A7', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50' },
  mapText: { color: '#1B5E20', fontWeight: 'bold', marginBottom: 20 },
  btnCapture: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  previewContainer: { width: '100%', alignItems: 'center' },
  preview: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
  locText: { color: '#1B5E20', marginBottom: 15, fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnUpload: { backgroundColor: '#1976D2', padding: 15, borderRadius: 8 },
  btnCancel: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8 }
});
