import { SecureStorageKeys, SecureStorageService } from '@services';
import { ESize, Icon, IconNames } from '@UIKit';
import { noop } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { BiometricKeyButton, DeleteButtonInRow } from '../components';

type Props = {
  handleDeletePress: () => void;
  hasEnteredSymbols: boolean;
};

// Создаем экземпляр класса
const reactNativeBiometrics = new ReactNativeBiometrics();

// Функция проверки поддержки Face ID
const checkForFaceIDSupport = async () => {
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

export const useGetActionButton = ({ handleDeletePress, hasEnteredSymbols }: Props) => {
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

  const getActionButton = useCallback(async () => {
    const { success, data: hasPin } = await SecureStorageService.getValue(
      SecureStorageKeys.PIN_CODE_IS_SET,
    );

    if (hasEnteredSymbols) {
      return (
        <DeleteButtonInRow disabled={false} onPress={handleDeletePress}>
          <Icon size={ESize.s40} name={IconNames.backspace} color="white" />
        </DeleteButtonInRow>
      );
    } else {
      return (
        <BiometricKeyButton
          disabled={success && hasPin !== 'true'}
          onPress={() => console.log('Биометрия')}
        >
          <Icon
            size={ESize.s40}
            color="white"
            name={Platform.OS === 'ios' && hasFaceID ? IconNames.faceId : IconNames.fingerprint}
          />
        </BiometricKeyButton>
      );
    }
  }, [handleDeletePress, hasEnteredSymbols, hasFaceID]);

  return { getActionButton };
};
