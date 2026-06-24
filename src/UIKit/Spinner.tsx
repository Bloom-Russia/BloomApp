import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Colors } from './constants';
import { Block } from './helpers';

export const Spinner: React.FC = () => {
  return (
    <Block flex={1} backgroundColor={Colors.black} justifyContent={'center'} alignItems={'center'}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </Block>
  );
};
