import { ESize, Icon, IconNames } from '@UIKit';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { BiometricKeyButton, DeleteButtonInRow } from '../components';

type Props = {
  handleDeletePress: () => void;
  onPressBiometricsButton: () => void;
  hasEnteredSymbols: boolean;
  isPinCodeSet: boolean;
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
            console.error('Биометрия недоступна: PIN не установлен');
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
