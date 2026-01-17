// PinCodeScreen.Loading.tsx
import { Colors, ScreenContainer } from '@UIKit';
import React, { memo } from 'react';
import { ActivityIndicator } from 'react-native';
import { LoadingContainer, LoadingText } from './components';

interface PinCodeLoadingProps {
  loadingText?: string;
}

/**
 * Компонент состояния загрузки для экрана PIN-кода
 */
export const PinCodeLoading: React.FC<PinCodeLoadingProps> = memo(
  ({ loadingText = 'Загрузка...' }) => {
    return (
      <ScreenContainer>
        <LoadingContainer>
          <ActivityIndicator size="large" color={Colors.white} />
          <LoadingText>{loadingText}</LoadingText>
        </LoadingContainer>
      </ScreenContainer>
    );
  },
);
