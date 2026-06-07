import { ESize, Icon, IconNames } from '@UIKit';
import { noop } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { BiometricKeyButton, DeleteButtonInRow } from '../components';

type Props = {
  handleDeletePress: () => void;
  hasEnteredSymbols: boolean;
  isPinCodeSet: boolean;
};

// Создаем экземпляр класса
const reactNativeBiometrics = new ReactNativeBiometrics();

// Функция проверки поддержки Face ID
export const checkForFaceIDSupport = async () => {
  if (Platform.OS === 'ios') {
    try {
      const { available, biometryType } = await reactNativeBiometrics.isSensorAvailable();
      return available && biometryType === 'FaceID';
    } catch (error) {
      console.error('Error checking biometrics:', error);
      return false;
    }
  }
  return false;
};

export const useGetActionButton = ({
  handleDeletePress,
  hasEnteredSymbols,
  isPinCodeSet,
}: Props) => {
  const [hasFaceID, setHasFaceID] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const hasFaceIDSupport = await checkForFaceIDSupport();
      setHasFaceID(hasFaceIDSupport);
    };

    if (Platform.OS === 'ios') {
      checkBiometrics().then(() => noop);
    }
  }, []);

  const getActionButton = useCallback(() => {
    // Убрал async, так как он не нужен
    if (hasEnteredSymbols) {
      return (
        <DeleteButtonInRow disabled={false} onPress={handleDeletePress}>
          <Icon size={ESize.s40} name={IconNames.backspace} color="white" />
        </DeleteButtonInRow>
      );
    }

    // Убрал else, так как return выше уже обработал этот случай
    return (
      <BiometricKeyButton
        disabled={!isPinCodeSet}
        onPress={() => {
          if (!isPinCodeSet) {
            console.log('❌ Биометрия недоступна: PIN не установлен');
            return;
          }
          console.log('🔐 Запуск биометрической аутентификации');
          // Здесь будет реальная биометрия
        }}
      >
        <Icon
          size={ESize.s40}
          color="white"
          name={Platform.OS === 'ios' && hasFaceID ? IconNames.faceId : IconNames.fingerprint}
        />
      </BiometricKeyButton>
    );
  }, [handleDeletePress, hasEnteredSymbols, hasFaceID, isPinCodeSet]);

  return { getActionButton };
};
