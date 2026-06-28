import { ChatStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, ScreenContainer, Typography } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';

type ChatScreenProps = NativeStackScreenProps<ChatStackParamList, EScreens.CHAT_SCREEN>;

const ChatScreenComponent: React.FC<ChatScreenProps> = () => {
  return (
    <ScreenContainer hideBackIcon title="Чат" paddingHorizontal={ESpacings.s16}>
      <Block flex={1} justifyContent={'center'}>
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          Chat Screen
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const ChatScreen = memo(ChatScreenComponent, isEqual);
