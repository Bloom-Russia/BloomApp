import { ESize, Icon, IconNames } from '@UIKit';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { BiometricKeyButton, DeleteButtonInRow } from '../components';

type Props = {
  handleDeletePress: () => void;
  onPressBiometricsButton: () => void;
  hasEnteredSymbols: boolean;
  isPinCodeSet: boolean;
};

const reactNativeBiometrics = new ReactNativeBiometrics();

export const checkForFaceIDSupport = async () => {
  if (Platform.OS === 'ios') {
    try {
      const { available, biometryType } = await reactNativeBiometrics.isSensorAvailable();
      return available && biometryType === 'FaceID';
    } catch (error) {
      console.error('❌ Ошибка проверки биометрии:', error);
      return false;
    }
  }
  return false;
};

export const useGetActionButton = ({
  handleDeletePress,
  hasEnteredSymbols,
  isPinCodeSet,
  onPressBiometricsButton,
}: Props) => {
  const getActionButton = useCallback(() => {
    if (hasEnteredSymbols) {
      return (
        <DeleteButtonInRow disabled={false} onPress={handleDeletePress}>
          <Icon size={ESize.s40} name={IconNames.backspace} color="white" />
        </DeleteButtonInRow>
      );
    }

    return (
      <BiometricKeyButton
        disabled={!isPinCodeSet}
        onPress={() => {
          if (!isPinCodeSet) {
            console.log('❌ Биометрия недоступна: PIN не установлен');
            return;
          }
          onPressBiometricsButton();
        }}
      >
        <Icon
          size={ESize.s40}
          color="white"
          name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
        />
      </BiometricKeyButton>
    );
  }, [handleDeletePress, hasEnteredSymbols, isPinCodeSet, onPressBiometricsButton]);

  return { getActionButton };
};
