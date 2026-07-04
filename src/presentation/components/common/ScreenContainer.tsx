import { IconNames } from '@core/assets';
import { Colors } from '@core/styles/Colors';
import { WINDOW_TOP_INSET } from '@core/styles/ScreenInfo';
import { ESize, ESpacings } from '@core/styles/Spacings';
import { useLoading } from '@hooks';
import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactNode, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import { Pressable, RefreshControl, ScrollView, StatusBar } from 'react-native';
import styled from 'styled-components';

import { Block, Row } from './Block';
import { FocusAwareStatusBar } from './FocusAwareStatusBar';
import { Icon } from './Icon';
import { Typography } from './Typography';

type ScreenContainerProps = {
  /** Дочерние элементы */
  children?: ReactNode;
  /** Включить скролл */
  scrollEnabled?: boolean;
  /** Заголовок */
  title?: string;
  /** Функция обновления */
  reload?: () => Promise<void>;
  /** Горизонтальный отступ */
  paddingHorizontal?: number;
  /** Отступ снизу */
  paddingBottom?: number;
  /** Отступ сверху */
  spaceTop?: number;
  /** Обработчик нажатия на иконку */
  onPressIcon?: () => void;
  /** Имя иконки */
  icon?: IconNames;
  /** Скрыть кнопку "Назад" */
  hideBackIcon?: boolean;
};

type StyledScrollViewProps = {
  backgroundColor: string;
};

type HeaderProps = {
  title: string;
  onPressIcon?: () => void;
  icon?: IconNames;
  hideBackIcon?: boolean;
};

/**
 * Компонент заголовка
 */
const Header: React.FC<HeaderProps> = ({ title, onPressIcon, icon, hideBackIcon }) => {
  const navigation = useNavigation();

  return (
    <Row
      marginBottom={ESpacings.s20}
      paddingRight={hideBackIcon ? ESpacings.s24 : ESpacings.s56}
      paddingLeft={icon ? ESpacings.s56 : ESpacings.s24}
      alignItems="center"
    >
      {hideBackIcon ? null : (
        <StyledPressableBack
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : Colors.transparent,
          })}
          onPress={navigation.goBack}
        >
          <Icon size={ESize.s20} color={Colors.white} name={IconNames.back} />
        </StyledPressableBack>
      )}

      <Row justifyContent="center" flex={1}>
        <Typography.B16 numberOfLines={1} color={Colors.white}>
          {title}
        </Typography.B16>
      </Row>

      {icon ? (
        <StyledPressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : Colors.transparent,
          })}
          onPress={onPressIcon}
        >
          <Icon size={ESize.s20} color={Colors.white} name={icon} />
        </StyledPressable>
      ) : null}
    </Row>
  );
};

/**
 * Компонент-контейнер для экранов
 * Обеспечивает единый стиль для всех экранов
 */
const ScreenContainerComponent: React.FC<ScreenContainerProps> = ({
  children,
  scrollEnabled = true,
  title,
  reload,
  paddingHorizontal = ESpacings.s16,
  paddingBottom = ESpacings.s16,
  spaceTop,
  onPressIcon,
  hideBackIcon,
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
      <Block flex={1} paddingTop={paddingTop} backgroundColor={Colors.backgroundPrimary}>
        <FocusAwareStatusBar
          barStyle="light-content"
          translucent
          backgroundColor={Colors.backgroundPrimary}
          animated
        />

        {title ? (
          <Header hideBackIcon={hideBackIcon} icon={icon} onPressIcon={onPressIcon} title={title} />
        ) : null}

        <StyledScrollView
          refreshControl={
            reload ? <RefreshControl refreshing={loading} onRefresh={handleReload} /> : undefined
          }
          backgroundColor={Colors.backgroundPrimary}
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
      backgroundColor={Colors.backgroundPrimary}
      paddingBottom={paddingBottom}
    >
      {title ? <Header hideBackIcon={hideBackIcon} title={title} /> : null}
      <Block flex={1} paddingHorizontal={paddingHorizontal}>
        {children}
      </Block>
    </Block>
  );
};

export const ScreenContainer = memo(ScreenContainerComponent, isEqual);

// ============================================
// СТИЛИ
// ============================================

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

const StyledPressableBack = styled(Pressable).attrs(() => ({
  android_ripple: {
    borderless: false,
    color: Colors.white,
  },
}))({
  alignItems: 'center',
  height: ESize.s32,
  width: ESize.s32,
  justifyContent: 'center',
  borderRadius: ESize.s8,
});
