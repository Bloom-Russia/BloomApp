import { Platform, Vibration } from 'react-native';

export const vibrate = (durationOrPattern: number | number[]) => {
  if (Platform.OS === 'ios') {
    // iOS поддерживает только предопределенные паттерны или кастомные
    if (typeof durationOrPattern === 'number') {
      Vibration.vibrate(durationOrPattern);
    } else {
      Vibration.vibrate(durationOrPattern, false);
    }
  } else {
    // Android поддерживает и продолжительность и паттерны
    Vibration.vibrate(durationOrPattern);
  }
};
