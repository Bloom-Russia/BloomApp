import { RootStackParamList } from '@navigation';
import { useNavigationContainerRef } from '@react-navigation/native';
import { NavigationService } from '@services';
import { useEffect, useRef } from 'react';

export const useNavigationService = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (navigationRef.isReady() && !isInitialized.current) {
      NavigationService.setNavigationRef(navigationRef);
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        NavigationService.setNavigationRef(null);
        isInitialized.current = false;
      }
    };
  }, [navigationRef]);

  return navigationRef;
};
