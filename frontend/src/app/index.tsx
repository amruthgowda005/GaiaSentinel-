import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gaia Sentinel</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>[ Map Placeholder: Leaflet / Mapbox ]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9', padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 20 },
  mapPlaceholder: { width: '100%', height: 300, backgroundColor: '#A5D6A7', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50' },
  mapText: { color: '#1B5E20', fontWeight: 'bold' }
});
