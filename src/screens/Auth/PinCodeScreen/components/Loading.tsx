import { Block, Colors, ScreenContainer, Typography } from '@UIKit';
import React from 'react';

export const Loading = () => {
  return (
    <ScreenContainer scrollEnabled={false}>
      <Block flex={1} justifyContent="center" alignItems="center">
        <Typography.R16 color={Colors.white}>Загрузка...</Typography.R16>
      </Block>
    </ScreenContainer>
  );
};
