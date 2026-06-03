import { View, Text, StyleSheet, ScrollView } from "react-native";

const ModuleCard = ({ title, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>Analyze {title.toLowerCase()} health and metrics.</Text>
  </View>
);

export default function ModulesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Environmental Modules</Text>
      <ModuleCard title="Plant" color="#4CAF50" />
      <ModuleCard title="Air" color="#03A9F4" />
      <ModuleCard title="Soil" color="#795548" />
      <ModuleCard title="Water" color="#2196F3" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 15, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { color: '#666', marginTop: 5 }
});
