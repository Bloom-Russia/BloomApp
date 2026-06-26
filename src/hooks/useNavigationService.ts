import { useNavigationContainerRef } from '@react-navigation/native';
import { NavigationService } from '@services';
import { useEffect } from 'react';

export const useNavigationService = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const serviceInstance = NavigationService;
    (serviceInstance as any).setNavigationRef(navigationRef);
  }, [navigationRef]);

  return navigationRef;
};
