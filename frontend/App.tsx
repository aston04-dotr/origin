/**
 * Shadow Run — Копы vs Бандиты
 * React Native + Mapbox + Backend
 */

import React from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { CopScreen } from './src/screens/CopScreen';
import { BanditScreen } from './src/screens/BanditScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ShopScreen } from './src/screens/ShopScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { player } = useAuth();
  const isCop = player?.role === 'cop';

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f1a' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1e293b' },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name={isCop ? 'CopMap' : 'BanditMap'}
        component={isCop ? CopScreen : BanditScreen}
        options={{
          title: isCop ? 'Патруль' : 'Побег',
          headerTitle: 'Shadow Run',
        }}
      />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Магазин' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { player, sessionId, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Загрузка...</Text>
      </View>
    );
  }
  if (!player || !sessionId) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

function App() {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
