import { useLoading } from '@hooks';
import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactNode, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import { Pressable, RefreshControl, ScrollView, StatusBar } from 'react-native';
import styled from 'styled-components';
import { Colors, ESize, ESpacings, Typography, WINDOW_TOP_INSET } from './constants';
import { FocusAwareStatusBar } from './FocusAwareStatusBar';
import { Block, Row } from './helpers';
import { Icon, IconNames } from './Icon';

type Props = {
  children?: ReactNode;
  scrollEnabled?: boolean;
  title?: string;
  reload?: () => Promise<void>;
  paddingHorizontal?: number;
  paddingBottom?: number;
  spaceTop?: number;
  onPressIcon?: () => void;
  icon?: IconNames;
};

type StyledScrollViewProps = {
  backgroundColor: string;
};

type HeaderProps = {
  title: string;
  onPressIcon?: () => void;
  icon?: IconNames;
};

export const Header: React.FC<HeaderProps> = ({ title, onPressIcon, icon }) => {
  const navigation = useNavigation();
  return (
    <Row
      marginBottom={ESpacings.s20}
      paddingRight={ESpacings.s24}
      alignItems={'center'}
      paddingLeft={icon ? ESpacings.s56 : ESpacings.s24}
    >
      <Row justifyContent={'center'} flex={1}>
        <Typography.B16 numberOfLines={1} color={Colors.white}>
          {title}
        </Typography.B16>
      </Row>
      {icon ? (
        <StyledPressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : Colors.transparent,
          })}
          onPress={onPressIcon || navigation.goBack}
        >
          <Icon size={ESize.s16} color={Colors.white} name={icon} />
        </StyledPressable>
      ) : null}
    </Row>
  );
};

const ScreenContainerComponent: React.FC<Props> = ({
  children,
  scrollEnabled = true,
  title,
  reload,
  paddingHorizontal = ESpacings.s16,
  paddingBottom = ESpacings.s16,
  spaceTop,
  onPressIcon,
  icon,
}) => {
  const { loading, hideLoader, showLoader } = useLoading();

  const handleReload = useCallback(async () => {
    if (reload) {
      showLoader();
      await reload();
      hideLoader();
    }
  }, [hideLoader, reload, showLoader]);

  const paddingTop = (StatusBar.currentHeight || WINDOW_TOP_INSET) + ESpacings.s16;

  if (scrollEnabled) {
    return (
      <Block flex={1} paddingTop={paddingTop} backgroundColor={Colors.black}>
        <FocusAwareStatusBar
          barStyle={'light-content'}
          translucent
          backgroundColor={Colors.black}
          animated={true}
        />
        {title ? <Header icon={icon} onPressIcon={onPressIcon} title={title} /> : null}
        <StyledScrollView
          refreshControl={
            reload ? <RefreshControl refreshing={loading} onRefresh={handleReload} /> : undefined
          }
          backgroundColor={Colors.black}
        >
          {children}
        </StyledScrollView>
      </Block>
    );
  }

  return (
    <Block
      paddingTop={spaceTop || paddingTop}
      flex={1}
      backgroundColor={Colors.black}
      paddingBottom={paddingBottom}
    >
      {title ? <Header title={title} /> : null}
      <Block flex={1} paddingHorizontal={paddingHorizontal}>
        {children}
      </Block>
    </Block>
  );
};

export const ScreenContainer = memo(ScreenContainerComponent, isEqual);

const StyledScrollView = styled(ScrollView).attrs<StyledScrollViewProps>(({ backgroundColor }) => ({
  contentContainerStyle: {
    flexGrow: 1,
    backgroundColor: backgroundColor,
    paddingHorizontal: ESpacings.s16,
    paddingBottom: ESpacings.s16,
  },
}))<StyledScrollViewProps>({});

const StyledPressable = styled(Pressable).attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.white,
  },
}))({
  alignItems: 'center',
  height: ESize.s32,
  width: ESize.s32,
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: Colors.white,
  borderRadius: ESize.s8,
});
