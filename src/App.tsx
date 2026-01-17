/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const App: React.FC = () => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <NewAppScreen templateFileName="App.tsx" safeAreaInsets={safeAreaInsets} />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
