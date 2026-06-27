import { EScreens, MyWorksStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Block, Colors, ESpacings, IconNames, ScreenContainer, Typography } from '@UIKit';
import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';

type MyWorksScreenProps = NativeStackScreenProps<MyWorksStackParamList, EScreens.MY_WORKS_SCREEN>;

const MyWorksScreenComponent: React.FC<MyWorksScreenProps> = ({ navigation }) => {
  const navigateToCreateWork = useCallback(() => {
    navigation.navigate(EScreens.CREATE_WORK_SCREEN);
  }, [navigation]);

  return (
    <ScreenContainer
      icon={IconNames.plus}
      onPressIcon={navigateToCreateWork}
      title="Записи"
      paddingHorizontal={ESpacings.s16}
      hideBackIcon
    >
      <Block
        flex={1}
        backgroundColor={Colors.black}
        justifyContent={'center'}
        padding={ESpacings.s16}
      >
        <Typography.B14 textAlign={'center'} marginBottom={ESpacings.s38} color={Colors.white}>
          My Works Screen
        </Typography.B14>
      </Block>
    </ScreenContainer>
  );
};

export const MyWorksScreen = memo(MyWorksScreenComponent, isEqual);
