import { EScreens } from '@navigation';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import Config from 'react-native-config';
import { NavigationProp } from '../types';

export const useAnimatedSplash = () => {
  const navigation = useNavigation<NavigationProp>();
  const lottieRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const navigateToLogin = (): void => {
      if (!isMounted) {
        return;
      }

      try {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: Number(Config.FADE_DURATION),
          useNativeDriver: true,
        }).start(() => {
          if (isMounted) {
            setIsVisible(false);
            navigation.navigate(EScreens.LOGIN_SCREEN);
          }
        });
      } catch (error) {
        console.error('Ошибка навигации:', error);
        if (isMounted) {
          setIsVisible(false);
          navigation.navigate(EScreens.LOGIN_SCREEN);
        }
      }
    };

    const animationTimer = setTimeout(() => {
      if (!lottieRef.current || !isMounted) {
        return;
      }

      const startTime = Date.now();

      const checkProgress = (): void => {
        if (!isMounted) {
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= Number(Config.ANIMATION_DURATION)) {
          navigateToLogin();
        } else {
          requestAnimationFrame(checkProgress);
        }
      };

      lottieRef.current.play();
      checkProgress();
    }, Number(Config.START_DELAY));

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('Fallback: переход по таймауту');
        navigateToLogin();
      }
    }, Number(Config.FALLBACK_TIMEOUT));

    return () => {
      isMounted = false;
      clearTimeout(animationTimer);
      clearTimeout(fallbackTimer);
    };
  }, [navigation, fadeAnim]);

  return { isVisible, fadeAnim, lottieRef };
};
