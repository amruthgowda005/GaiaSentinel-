import { Slot } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MENU_ITEMS = [
  { name: 'CORE:COMMAND', active: true },
  { name: 'PlantTalk' },
  { name: 'AirTrace' },
  { name: 'EcoTwin' },
  { name: 'SoilSense' },
  { name: 'FireWhisper' },
  { name: 'RiverPulse' },
  { name: 'PolliNet' },
  { name: 'GreenKarma' },
  { name: 'NestGuard' },
  { name: 'WildPath' },
  { name: 'WetlandWatch' },
  { name: 'CarbonMirror' },
];

export default function RootLayout() {
  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={{color: '#000', fontWeight: 'bold', fontSize: 20}}>§</Text>
          </View>
          <View>
            <Text style={styles.logoText}>GaiaSentinel</Text>
            <Text style={styles.logoSubText}>PLANETARY AI</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>12 NODES ACTIVE</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item, idx) => (
            <View key={idx} style={[styles.menuItem, item.active && styles.menuItemActive]}>
              <Text style={[styles.menuText, item.active && styles.menuTextActive]}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>12 modules synced • PNS: ONLINE</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#02050A' },
  sidebar: { width: 260, backgroundColor: '#050914', borderRightWidth: 1, borderRightColor: '#1A233A', padding: 20 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  logoIcon: { width: 40, height: 40, backgroundColor: '#00E5FF', borderRadius: 8, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  logoSubText: { color: '#00E5FF', fontSize: 10, letterSpacing: 2, marginTop: 2, fontWeight: 'bold' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E5FF', marginRight: 10, shadowColor: '#00E5FF', shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 5 },
  statusText: { color: '#8A99B5', fontSize: 12, fontWeight: 'bold' },
  menuList: { flex: 1 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 15, borderRadius: 8, marginBottom: 4 },
  menuItemActive: { backgroundColor: 'rgba(0, 229, 255, 0.05)', borderLeftWidth: 3, borderLeftColor: '#00E5FF', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  menuText: { color: '#8A99B5', fontSize: 14, fontWeight: '500' },
  menuTextActive: { color: '#00E5FF', fontWeight: 'bold' },
  footer: { paddingTop: 20, borderTopWidth: 1, borderTopColor: '#1A233A' },
  footerText: { color: '#4A5B7A', fontSize: 11 },
  main: { flex: 1, backgroundColor: '#02050A' }
});
