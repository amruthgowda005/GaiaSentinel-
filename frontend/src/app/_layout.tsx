import { Slot } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ModuleProvider, useModule } from './ModuleContext';

const MENU_ITEMS = [
  { name: 'CORE:COMMAND', icon: '⌂' },
  { name: 'PlantTalk', icon: '🌱' },
  { name: 'AirTrace', icon: '💨' },
  { name: 'EcoTwin', icon: '🌍' },
  { name: 'SoilSense', icon: '🪨' },
  { name: 'FireWhisper', icon: '🔥' },
  { name: 'RiverPulse', icon: '💧' },
  { name: 'PolliNet', icon: '🐝' },
  { name: 'GreenKarma', icon: '♻️' },
  { name: 'NestGuard', icon: '🦅' },
  { name: 'WildPath', icon: '🐾' },
  { name: 'WetlandWatch', icon: '🌿' },
  { name: 'CarbonMirror', icon: '📊' },
];

// Modules that are fully implemented
const ACTIVE_MODULES = ['CORE:COMMAND', 'PlantTalk', 'AirTrace', 'SoilSense', 'RiverPulse'];

function Sidebar() {
  const { activeModule, setActiveModule, aggregateData, location } = useModule();

  const handleSelect = (name: string) => {
    if (!ACTIVE_MODULES.includes(name)) {
      Alert.alert('Coming Soon', `${name} module will be available in a future phase.`);
      return;
    }
    setActiveModule(name as any);
  };

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>§</Text>
        </View>
        <View>
          <Text style={styles.logoText}>GaiaSentinel</Text>
          <Text style={styles.logoSubText}>PLANETARY AI</Text>
        </View>
      </View>

      {/* Node Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: aggregateData ? '#00E5FF' : '#4A5B7A' }]} />
        <Text style={styles.statusText}>{aggregateData ? '12 NODES ACTIVE' : 'AWAITING SCAN'}</Text>
      </View>

      {/* Location indicator */}
      {location && (
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>📍 {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</Text>
        </View>
      )}

      {/* Menu */}
      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item, idx) => {
          const isActive = activeModule === item.name;
          const isEnabled = ACTIVE_MODULES.includes(item.name);
          return (
            <TouchableOpacity key={idx} onPress={() => handleSelect(item.name)}
              style={[styles.menuItem, isActive && styles.menuItemActive, !isEnabled && styles.menuItemDisabled]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuText, isActive && styles.menuTextActive, !isEnabled && styles.menuTextDisabled]}>
                {item.name}
              </Text>
              {isActive && <View style={styles.activePip} />}
              {!isEnabled && <Text style={styles.comingSoon}>soon</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {aggregateData ? '12 modules synced • PNS: ONLINE' : 'PNS: STANDBY'}
        </Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ModuleProvider>
      <View style={styles.container}>
        <Sidebar />
        <View style={styles.main}>
          <Slot />
        </View>
      </View>
    </ModuleProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#02050A' },
  sidebar: { width: 230, backgroundColor: '#050914', borderRightWidth: 1, borderRightColor: '#1A233A', paddingVertical: 20, paddingHorizontal: 16 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoIcon: { width: 38, height: 38, backgroundColor: '#00E5FF', borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  logoSubText: { color: '#00E5FF', fontSize: 9, letterSpacing: 2, fontWeight: 'bold', marginTop: 1 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#8A99B5', fontSize: 11, fontWeight: 'bold' },
  locationBadge: { backgroundColor: 'rgba(0,229,255,0.05)', borderWidth: 1, borderColor: '#1A233A', borderRadius: 6, padding: 6, marginBottom: 14 },
  locationText: { color: '#4A5B7A', fontSize: 10 },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10, borderRadius: 7, marginBottom: 2 },
  menuItemActive: { backgroundColor: 'rgba(0,229,255,0.07)', borderLeftWidth: 2, borderLeftColor: '#00E5FF', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  menuItemDisabled: { opacity: 0.45 },
  menuIcon: { fontSize: 14, marginRight: 10, width: 20 },
  menuText: { color: '#8A99B5', fontSize: 13, fontWeight: '500', flex: 1 },
  menuTextActive: { color: '#00E5FF', fontWeight: 'bold' },
  menuTextDisabled: { color: '#4A5B7A' },
  activePip: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5FF' },
  comingSoon: { color: '#4A5B7A', fontSize: 9, fontStyle: 'italic' },
  footer: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1A233A' },
  footerText: { color: '#4A5B7A', fontSize: 10 },
  main: { flex: 1, backgroundColor: '#02050A' },
});
