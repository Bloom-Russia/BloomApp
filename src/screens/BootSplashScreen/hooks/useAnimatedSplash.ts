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
    let isComponentMounted = true;

    const navigateToLogin = (): void => {
      if (!isComponentMounted) {
        return;
      }

      try {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: Number(Config.FADE_DURATION),
          useNativeDriver: true,
        }).start(() => {
          if (isComponentMounted) {
            setIsVisible(false);
            navigation.navigate(EScreens.LOGIN_SCREEN);
          }
        });
      } catch (error) {
        console.error('Ошибка навигации:', error);
        if (isComponentMounted) {
          setIsVisible(false);
          navigation.navigate(EScreens.LOGIN_SCREEN);
        }
      }
    };

    const animationTimer = setTimeout(() => {
      if (!lottieRef.current || !isComponentMounted) {
        return;
      }

      const animationStartTime = Date.now();

      const checkProgress = (): void => {
        if (!isComponentMounted) {
          return;
        }

        const elapsedTime = Date.now() - animationStartTime;
        const progress = elapsedTime / Number(Config.ANIMATION_DURATION);

        if (progress >= 1) {
          navigateToLogin();
        } else {
          requestAnimationFrame(checkProgress);
        }
      };

      lottieRef.current.play();
      checkProgress();
    }, Number(Config.START_DELAY));

    const fallbackTimer = setTimeout(() => {
      if (isComponentMounted) {
        console.warn('Fallback: переход по таймауту');
        navigateToLogin();
      }
    }, Number(Config.FALLBACK_TIMEOUT));

    return () => {
      isComponentMounted = false;
      clearTimeout(animationTimer);
      clearTimeout(fallbackTimer);
    };
  }, [navigation, fadeAnim]);

  return {
    isVisible,
    fadeAnim,
    lottieRef,
  };
};
