import { Slot } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ModuleProvider, useModule } from './ModuleContext';
import * as ImagePicker from 'expo-image-picker';

const MENU_ITEMS = [
  { name: 'CORE:COMMAND', icon: '⌂' },
  { name: 'PlantTalk',    icon: '🌱' },
  { name: 'AirTrace',     icon: '💨' },
  { name: 'EcoTwin',      icon: '🌍' },
  { name: 'SoilSense',    icon: '🪨' },
  { name: 'FireWhisper',  icon: '🔥' },
  { name: 'RiverPulse',   icon: '💧' },
  { name: 'PolliNet',     icon: '🐝' },
  { name: 'GreenKarma',   icon: '♻️' },
  { name: 'NestGuard',    icon: '🦅' },
  { name: 'WildPath',     icon: '🐾' },
  { name: 'WetlandWatch', icon: '🌿' },
  { name: 'CarbonMirror', icon: '📊' },
  { name: 'History',      icon: '🕐' },
  { name: 'Admin',        icon: '⚙️' },
  { name: 'NatureGPT',    icon: '🤖' },
];

const ACTIVE_MODULES = ['CORE:COMMAND', 'PlantTalk', 'AirTrace', 'SoilSense', 'RiverPulse', 'History', 'Admin', 'NatureGPT'];

// ─── Sidebar inner component (has access to context) ─────────────────────────
function Sidebar() {
  const { activeModule, setActiveModule,
    aggregateData, setAggregateData,
    location, setLocation,
    imageUri, setImageUri,
    setAnalysisResult,
    soilPh, setSoilPh,
    soilMoisture, setSoilMoisture,
    setSoilResult,
    isLoading, setIsLoading,
    insights, setInsights,
  } = useModule();

  // ── Location helpers ──────────────────────────────────────────────────────
  const fetchAggregate = async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/aggregate?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setAggregateData(data);
      // Phase 8: auto-run rule engine
      const insightRes = await fetch('http://localhost:8000/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aqi: data.air?.aqi ?? 50,
          water_score: data.water?.score ?? 80,
          phi_score: 75,
          soil_score: 80,
          water_ph: data.water?.metrics?.ph ?? 7.0,
          turbidity: data.water?.metrics?.turbidity_ntu ?? 3.0,
        })
      });
      const insightData = await insightRes.json();
      const fetchedInsights = insightData.insights ?? [];
      setInsights(fetchedInsights);
      // Phase 9: auto-save scan to SQLite history
      await fetch('http://localhost:8000/scan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          aqi: data.air?.aqi ?? 0,
          aqi_status: data.air?.status ?? 'Unknown',
          water_score: data.water?.score ?? 0,
          water_status: data.water?.status ?? 'Unknown',
          water_ph: data.water?.metrics?.ph ?? 7.0,
          turbidity: data.water?.metrics?.turbidity_ntu ?? 0,
          insights_count: fetchedInsights.length,
        })
      });
    } catch {
      Alert.alert('Backend Error', 'Cannot reach backend at localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { handleDemoMode(); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        await fetchAggregate(latitude, longitude);
      },
      () => handleDemoMode()
    );
  };

  const handleDemoMode = async () => {
    const lat = 12.9716, lon = 77.5946;
    setLocation({ latitude: lat, longitude: lon });
    await fetchAggregate(lat, lon);
  };

  // ── PlantTalk helpers ─────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); setAnalysisResult(null); }
  };

  const handleAnalyze = async () => {
    if (!imageUri) { Alert.alert('No Image', 'Upload a plant image first.'); return; }
    try {
      const formData = new FormData();
      if (imageUri.startsWith('data:')) {
        const blob = await (await fetch(imageUri)).blob();
        formData.append('file', blob, 'plant.jpg');
      } else {
        formData.append('file', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as any);
      }
      const res = await fetch('http://localhost:8000/plant/analyze', { method: 'POST', body: formData });
      setAnalysisResult(await res.json());
    } catch { Alert.alert('Failed', 'Could not connect to backend.'); }
  };

  // ── SoilSense helpers ─────────────────────────────────────────────────────
  const handleSoilAnalyze = async () => {
    if (!soilPh || !soilMoisture) { Alert.alert('Required', 'Enter pH and Moisture values.'); return; }
    try {
      const res = await fetch('http://localhost:8000/soil/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ph: parseFloat(soilPh), moisture: parseFloat(soilMoisture), soil_type: 'Loam' })
      });
      setSoilResult(await res.json());
    } catch { Alert.alert('Failed', 'Could not reach backend.'); }
  };

  const handleSelect = (name: string) => {
    if (!ACTIVE_MODULES.includes(name)) {
      Alert.alert('Coming Soon', `${name} module will be available in a future phase.`);
      return;
    }
    setActiveModule(name as any);
  };

  // ── Module-specific sidebar controls ──────────────────────────────────────
  const renderModuleControls = () => {
    switch (activeModule) {
      case 'PlantTalk':
        return (
          <View style={styles.moduleControls}>
            <Text style={styles.controlsHeader}>PLANTTALK CONTROLS</Text>
            <TouchableOpacity style={styles.ctrlBtn} onPress={handlePickImage}>
              <Text style={styles.ctrlBtnTxt}>📂 Upload Plant Image</Text>
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity style={[styles.ctrlBtn, { borderColor: '#FFC107' }]} onPress={handleAnalyze}>
                <Text style={[styles.ctrlBtnTxt, { color: '#FFC107' }]}>🔬 Analyze Plant</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'SoilSense':
        return (
          <View style={styles.moduleControls}>
            <Text style={styles.controlsHeader}>SOILSENSE CONTROLS</Text>
            <Text style={styles.inputLabel}>Soil pH</Text>
            <TextInput
              style={styles.sideInput}
              placeholder="e.g. 6.5"
              placeholderTextColor="#4A5B7A"
              keyboardType="numeric"
              value={soilPh}
              onChangeText={setSoilPh}
            />
            <Text style={styles.inputLabel}>Moisture %</Text>
            <TextInput
              style={styles.sideInput}
              placeholder="e.g. 45"
              placeholderTextColor="#4A5B7A"
              keyboardType="numeric"
              value={soilMoisture}
              onChangeText={setSoilMoisture}
            />
            <TouchableOpacity style={styles.ctrlBtn} onPress={handleSoilAnalyze}>
              <Text style={styles.ctrlBtnTxt}>⚙️ Run Scan</Text>
            </TouchableOpacity>
          </View>
        );

      case 'AirTrace':
      case 'RiverPulse':
        if (!aggregateData) {
          return (
            <View style={styles.moduleControls}>
              <Text style={styles.controlsHeader}>DATA SOURCE</Text>
              <TouchableOpacity style={styles.ctrlBtn} onPress={handleGetLocation}>
                <Text style={styles.ctrlBtnTxt}>📡 Get Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctrlBtn, { borderColor: '#FFC107', marginTop: 6 }]} onPress={handleDemoMode}>
                <Text style={[styles.ctrlBtnTxt, { color: '#FFC107' }]}>⚡ Demo Mode</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return null;

      case 'History':
        return (
          <View style={styles.moduleControls}>
            <Text style={styles.controlsHeader}>HISTORY CONTROLS</Text>
            <TouchableOpacity style={[styles.ctrlBtn, { borderColor: '#F44336' }]} onPress={async () => {
              await fetch('http://localhost:8000/scan/history', { method: 'DELETE' });
              Alert.alert('Cleared', 'Scan history has been deleted.');
            }}>
              <Text style={[styles.ctrlBtnTxt, { color: '#F44336' }]}>🗑 Clear History</Text>
            </TouchableOpacity>
          </View>
        );

      case 'Admin':
        return (
          <View style={styles.moduleControls}>
            <Text style={styles.controlsHeader}>ADMIN CONTROLS</Text>
            <Text style={{ color: '#4A5B7A', fontSize: 10 }}>View system health and logs in the main panel.</Text>
          </View>
        );

      case 'NatureGPT':
        return (
          <View style={styles.moduleControls}>
            <Text style={styles.controlsHeader}>NATURE GPT</Text>
            <Text style={{ color: '#4A5B7A', fontSize: 10 }}>Ask questions based on local planetary scan data.</Text>
          </View>
        );

      default:
        return null;
    }
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

      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: aggregateData ? '#00E5FF' : '#4A5B7A' }]} />
        <Text style={styles.statusText}>{aggregateData ? '12 NODES ACTIVE' : 'AWAITING SCAN'}</Text>
      </View>

      {location && (
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>📍 {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</Text>
        </View>
      )}

      {/* Navigation */}
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

      {/* Module-specific controls */}
      {renderModuleControls()}

      {/* Location controls (shown on CORE:COMMAND) */}
      {activeModule === 'CORE:COMMAND' && (
        <View style={styles.moduleControls}>
          <Text style={styles.controlsHeader}>PLANETARY SCAN</Text>
          <TouchableOpacity style={styles.ctrlBtn} onPress={handleGetLocation} disabled={isLoading}>
            <Text style={styles.ctrlBtnTxt}>{isLoading ? '⏳ Syncing...' : '📡 Get Location'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, { borderColor: '#FFC107', marginTop: 6 }]} onPress={handleDemoMode} disabled={isLoading}>
            <Text style={[styles.ctrlBtnTxt, { color: '#FFC107' }]}>⚡ Demo Mode</Text>
          </TouchableOpacity>
        </View>
      )}

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
  sidebar: { width: 230, backgroundColor: '#050914', borderRightWidth: 1, borderRightColor: '#1A233A', paddingVertical: 20, paddingHorizontal: 14 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  logoIcon: { width: 36, height: 36, backgroundColor: '#00E5FF', borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  logoSubText: { color: '#00E5FF', fontSize: 9, letterSpacing: 2, fontWeight: 'bold', marginTop: 1 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#8A99B5', fontSize: 11, fontWeight: 'bold' },
  locationBadge: { backgroundColor: 'rgba(0,229,255,0.04)', borderWidth: 1, borderColor: '#1A233A', borderRadius: 6, padding: 5, marginBottom: 12 },
  locationText: { color: '#4A5B7A', fontSize: 10 },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 7, marginBottom: 2 },
  menuItemActive: { backgroundColor: 'rgba(0,229,255,0.07)', borderLeftWidth: 2, borderLeftColor: '#00E5FF', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  menuItemDisabled: { opacity: 0.4 },
  menuIcon: { fontSize: 13, marginRight: 9, width: 18 },
  menuText: { color: '#8A99B5', fontSize: 12, fontWeight: '500', flex: 1 },
  menuTextActive: { color: '#00E5FF', fontWeight: 'bold' },
  menuTextDisabled: { color: '#4A5B7A' },
  activePip: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00E5FF' },
  comingSoon: { color: '#4A5B7A', fontSize: 9, fontStyle: 'italic' },

  // Module controls section
  moduleControls: { borderTopWidth: 1, borderTopColor: '#1A233A', paddingTop: 14, marginTop: 10, paddingBottom: 4 },
  controlsHeader: { color: '#4A5B7A', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  ctrlBtn: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#00E5FF', borderRadius: 7, backgroundColor: 'rgba(0,229,255,0.05)', marginBottom: 6 },
  ctrlBtnTxt: { color: '#00E5FF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 },
  inputLabel: { color: '#8A99B5', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  sideInput: { backgroundColor: '#02050A', color: '#00E5FF', borderWidth: 1, borderColor: '#1A233A', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 10 },

  footer: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1A233A' },
  footerText: { color: '#4A5B7A', fontSize: 10 },
  main: { flex: 1, backgroundColor: '#02050A' },
});
