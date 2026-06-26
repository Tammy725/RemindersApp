import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from './src/context/AppContext';
import HoyScreen from './src/screens/HoyScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import MetricasScreen from './src/screens/MetricasScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import BottomNav from './src/components/BottomNav';
import TopBar from './src/components/TopBar';
import colors from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

function MainNavigator() {
  const [activeTab, setActiveTab] = useState('Hoy');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Hoy': return <HoyScreen />;
      case 'Calendario': return <CalendarioScreen />;
      case 'Metricas': return <MetricasScreen />;
      case 'Ajustes': return <AjustesScreen />;
      default: return <HoyScreen />;
    }
  };

  const getTopBarTitle = () => {
    switch (activeTab) {
      case 'Hoy': return 'Tareas del Día';
      case 'Calendario': return 'Calendario';
      case 'Metricas': return 'Metricas';
      case 'Ajustes': return 'Ajustes';
      default: return 'Tareas del Día';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <TopBar title={getTopBarTitle()} />
      {renderScreen()}
      <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});