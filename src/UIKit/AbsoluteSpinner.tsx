import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components';
import { Colors } from './constants';
import { Block } from './helpers';

export const AbsoluteSpinner = () => {
  return (
    <AbsoluteWrapper
      flex={1}
      backgroundColor={'rgba(0, 0, 0, 0.5)'}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
    </AbsoluteWrapper>
  );
};

const AbsoluteWrapper = styled(Block)({
  flex: 1,
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});
