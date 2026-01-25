// useGetActionButton.tsx - упрощенная версия
import { ESize, Icon, IconNames } from '@UIKit';
import React from 'react';
import { Platform } from 'react-native';
import { BiometricKeyButton, DeleteButtonInRow } from '../components';

type Props = {
  handleDeletePress: () => void;
  hasEnteredSymbols: boolean;
};

export const useGetActionButton = ({ handleDeletePress, hasEnteredSymbols }: Props) => {
  const getActionButton = () => {
    if (hasEnteredSymbols) {
      return (
        <DeleteButtonInRow disabled={false} onPress={handleDeletePress}>
          <Icon size={ESize.s40} name={IconNames.cancel} color="white" />
        </DeleteButtonInRow>
      );
    } else {
      return (
        <BiometricKeyButton disabled={false} onPress={() => console.log('Биометрия')}>
          <Icon
            size={ESize.s40}
            color="white"
            name={Platform.OS === 'ios' ? IconNames.faceId : IconNames.fingerprint}
          />
        </BiometricKeyButton>
      );
    }
  };

  return { getActionButton };
};
