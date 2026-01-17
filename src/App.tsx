/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
// ✅ Убедитесь в правильности импортов
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Создаем внутренний компонент для использования safe area
const AppContent: React.FC = () => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle={'light-content'} />
      <View style={styles.container}>
        <NewAppScreen templateFileName="App.tsx" safeAreaInsets={safeAreaInsets} />
      </View>
    </>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
