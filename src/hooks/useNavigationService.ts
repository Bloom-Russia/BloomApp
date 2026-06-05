import { useNavigationContainerRef } from '@react-navigation/native';
import { NavigationService } from '@services';
import { useEffect } from 'react';

export const useNavigationService = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Используем метод экземпляра вместо статического
    // и явно приводим тип
    const serviceInstance = NavigationService;
    (serviceInstance as any).setNavigationRef(navigationRef);

    // Альтернативно, можно добавить метод в экземпляр:
    // serviceInstance.setNavigationRef(navigationRef);
  }, [navigationRef]);

  return navigationRef;
};
