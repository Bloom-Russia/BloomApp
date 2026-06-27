import { EScreens, MyWorksStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, ScreenContainer, Typography } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';

type CreateWorkScreenProps = NativeStackScreenProps<
  MyWorksStackParamList,
  EScreens.CREATE_WORK_SCREEN
>;

const CreateWorkScreenComponent: React.FC<CreateWorkScreenProps> = () => {
  return (
    <ScreenContainer title="Создание записи" paddingHorizontal={ESpacings.s16}>
      <Block
        flex={1}
        backgroundColor={Colors.black}
        justifyContent={'center'}
        padding={ESpacings.s16}
      >
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          Создание записи
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const CreateWorkScreen = memo(CreateWorkScreenComponent, isEqual);
