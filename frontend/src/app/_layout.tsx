import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ 
      headerStyle: { backgroundColor: '#2E7D32' },
      headerTintColor: '#fff',
      tabBarActiveTintColor: '#2E7D32',
      tabBarInactiveTintColor: 'gray'
    }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="modules" options={{ title: "Modules" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
