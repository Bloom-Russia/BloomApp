import { Colors, ESize, Icon, IconNames } from '@UIKit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Config from 'react-native-config';
import {
  AlertContainer,
  Backdrop,
  BackdropView,
  ButtonIcon,
  ButtonsContainer,
  ButtonText,
  ContentContainer,
  Divider,
  IconContainer,
  InputField,
  Message,
  Overlay,
  StyledButton,
  Title20,
} from './components';
import { COLORS, SPACING } from './constans';
import {
  CustomAlertButton,
  CustomAlertConfig,
  CustomAlertState,
  ShadowStyle,
  UseCustomAlertReturn,
} from './types';

const getDoubleShadowStyles = (shadowColor: string): ShadowStyle => ({
  shadowColor,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 1.0,
  shadowRadius: 0,
  elevation: 20,
});

const darkenColor = (color: string, percent: number = 25): string => {
  if (!color.startsWith('#')) {
    return color;
  }

  try {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    if (isNaN(num)) {
      return color;
    }

    const r = Math.floor(num / 65536);
    const g = Math.floor((num % 65536) / 256);
    const b = num % 256;

    const amount = Math.round(2.55 * percent);
    const newR = Math.max(0, Math.min(255, r - amount));
    const newG = Math.max(0, Math.min(255, g - amount));
    const newB = Math.max(0, Math.min(255, b - amount));

    const newHex = (newR * 65536 + newG * 256 + newB).toString(16).padStart(6, '0');
    return `#${newHex}`;
  } catch {
    return color;
  }
};

export const useCustomAlert = (): UseCustomAlertReturn => {
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    theme: 'dark',
    buttons: [],
    cancelable: true,
    showIcon: true,
    showDivider: true,
    borderRadius: 16,
    shadow: true,
    shadowColorDark: COLORS.SHADOW_RED_DARK,
    shadowColorLight: COLORS.SHADOW_RED_LIGHT,
    input: undefined,
    onInputChange: undefined,
    customBackgroundColor: undefined,
    customAccentColor: undefined,
    autoHide: false,
  });

  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAutoHideTimer = useCallback((): void => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const getAlertColors = useCallback((type: CustomAlertConfig['type'] = 'info') => {
    const colors = {
      info: {
        backgroundColor: '#1a1a2e',
        accentColor: '#4cc9f0',
        textColor: COLORS.WHITE,
        borderColor: '#16213e',
        iconColor: '#4cc9f0',
        iconName: IconNames.info,
      },
      warning: {
        backgroundColor: '#2d2424',
        accentColor: '#ff9a00',
        textColor: COLORS.WHITE,
        borderColor: '#4a3a3a',
        iconColor: '#ff9a00',
        iconName: IconNames.warning,
      },
      error: {
        backgroundColor: COLORS.BLACK,
        accentColor: '#ff4757',
        textColor: COLORS.WHITE,
        borderColor: '#4a2a2a',
        iconColor: '#ff4757',
        iconName: IconNames.error,
      },
      success: {
        backgroundColor: '#1b2d1b',
        accentColor: '#2ed573',
        textColor: COLORS.WHITE,
        borderColor: '#2a4a2a',
        iconColor: '#2ed573',
        iconName: IconNames.success,
      },
      question: {
        backgroundColor: '#1a1a2e',
        accentColor: '#9d4edd',
        textColor: COLORS.WHITE,
        borderColor: '#16213e',
        iconColor: '#9d4edd',
        iconName: IconNames.question,
      },
    };

    return colors[type] || colors.info;
  }, []);

  const getThemeColors = useCallback(
    (theme: 'light' | 'dark', typeColors: ReturnType<typeof getAlertColors>) => {
      if (theme === 'light') {
        return {
          backgroundColor: COLORS.WHITE,
          borderColor: COLORS.GRAY_MEDIUM,
          textColor: COLORS.GRAY_DARK,
          accentColor: typeColors.accentColor,
          iconColor: typeColors.iconColor,
        };
      }

      return {
        backgroundColor: typeColors.backgroundColor,
        borderColor: typeColors.borderColor,
        textColor: typeColors.textColor,
        accentColor: typeColors.accentColor,
        iconColor: typeColors.iconColor,
      };
    },
    [],
  );

  const hideAlert = useCallback((): void => {
    clearAutoHideTimer();
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, [clearAutoHideTimer]);

  const showAlert = useCallback(
    (config: CustomAlertConfig): void => {
      clearAutoHideTimer();

      const buttonsWithDefaults =
        config.buttons?.map((button) => ({
          ...button,
          showButtonIcon: button.showButtonIcon ?? null,
          buttonIconName: button.buttonIconName ?? null,
        })) || [];

      setAlertState((prev) => ({
        ...prev,
        visible: true,
        title: config.title || '',
        message: config.message || '',
        type: config.type || 'info',
        theme: config.theme || 'dark',
        buttons: buttonsWithDefaults,
        cancelable: config.cancelable !== false,
        onDismiss: config.onDismiss,
        showIcon: config.showIcon !== false,
        showDivider: config.showDivider !== false,
        borderRadius: config.borderRadius || 16,
        shadow: config.shadow !== false,
        shadowColorDark: config.shadowColorDark || COLORS.SHADOW_RED_DARK,
        shadowColorLight: config.shadowColorLight || COLORS.SHADOW_RED_LIGHT,
        input: config.input,
        onInputChange: config.onInputChange,
        customBackgroundColor: config.customBackgroundColor,
        customAccentColor: config.customAccentColor,
        autoHide: config.autoHide || false,
      }));

      if (config.autoHide) {
        autoHideTimerRef.current = setTimeout(() => {
          hideAlert();
          if (config.onDismiss) {
            config.onDismiss();
          }
        }, Number(Config.ERROR_TIMEOUT));
      }
    },
    [clearAutoHideTimer, hideAlert],
  );

  const handleBackdropPress = useCallback((): void => {
    if (alertState.cancelable) {
      hideAlert();
      alertState.onDismiss?.();
    }
  }, [alertState, hideAlert]);

  const handleButtonPress = useCallback(
    (button: CustomAlertButton): void => {
      button.onPress?.();
      clearAutoHideTimer();
      if (button.closeOnPress !== false) {
        hideAlert();
      }
    },
    [clearAutoHideTimer, hideAlert],
  );

  useEffect(() => {
    return () => {
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer]);

  const AlertComponent = useMemo(() => {
    const Component: React.FC = () => {
      if (!alertState.visible) {
        return null;
      }

      const typeColors = getAlertColors(alertState.type);
      const themeColors = getThemeColors(alertState.theme, typeColors);

      const backgroundColor = alertState.customBackgroundColor || themeColors.backgroundColor;
      const accentColor = alertState.customAccentColor || themeColors.accentColor;
      const iconColor = alertState.customAccentColor || themeColors.iconColor;

      const shadowColor =
        alertState.theme === 'light' ? alertState.shadowColorLight : alertState.shadowColorDark;

      const shadowStyle = alertState.shadow ? getDoubleShadowStyles(shadowColor) : undefined;

      const showDivider =
        alertState.showDivider && alertState.buttons && alertState.buttons.length > 0;

      const styles = {
        title: { marginBottom: SPACING.XS } as const,
        message: {
          marginBottom: alertState.input ? SPACING.SM : SPACING.MD,
        } as const,
        input: {
          borderColor: accentColor,
          color: themeColors.textColor,
          backgroundColor:
            themeColors.backgroundColor === COLORS.WHITE
              ? COLORS.GRAY_LIGHT
              : COLORS.SEMI_TRANSPARENT_WHITE,
          marginBottom: SPACING.MD,
        } as const,
        getButtonMargin: (index: number): number => (index > 0 ? SPACING.XS : 0),
      };

      return (
        <Overlay>
          <Backdrop onPress={handleBackdropPress}>
            <BackdropView />
          </Backdrop>

          <AlertContainer
            backgroundColor={backgroundColor}
            borderColor={themeColors.borderColor}
            borderRadius={alertState.borderRadius}
            shadow={alertState.shadow}
            shadowStyle={shadowStyle}
          >
            {alertState.showIcon && (
              <IconContainer>
                <Icon size={ESize.s48} color={iconColor} name={typeColors.iconName} />
              </IconContainer>
            )}

            <ContentContainer>
              {!!alertState.title && (
                <Title20 color={accentColor} align="center" style={styles.title}>
                  {alertState.title}
                </Title20>
              )}

              {!!alertState.message && (
                <Message color={themeColors.textColor} align="center" style={styles.message}>
                  {alertState.message}
                </Message>
              )}

              {alertState.input && (
                <InputField
                  placeholder={alertState.input.placeholder}
                  value={alertState.input.value}
                  onChangeText={alertState.onInputChange}
                  secureTextEntry={alertState.input.secure}
                  keyboardType={alertState.input.keyboardType}
                  autoCapitalize="none"
                  borderColor={styles.input.borderColor}
                  color={styles.input.color}
                  backgroundColor={styles.input.backgroundColor}
                  style={{ marginBottom: styles.input.marginBottom }}
                />
              )}

              {showDivider && <Divider color={themeColors.borderColor} />}

              {alertState.buttons && alertState.buttons.length > 0 && (
                <ButtonsContainer>
                  {alertState.buttons.map((button, index) => {
                    const isDestructive = button.style === 'destructive';
                    const isCancel = button.style === 'cancel';

                    let buttonColor = accentColor;
                    let textColor = Colors.white;

                    if (isCancel) {
                      buttonColor = darkenColor(COLORS.GRAY_CANCEL, 25);
                      textColor = Colors.white;
                    } else if (isDestructive) {
                      buttonColor = COLORS.RED_DESTRUCTIVE;
                      textColor = Colors.white;
                    } else {
                      buttonColor = accentColor;
                      textColor = Colors.white;
                    }

                    const showIcon = !!button.showButtonIcon;
                    const buttonIconName = button.buttonIconName || null;

                    return (
                      <StyledButton
                        key={index}
                        backgroundColor={buttonColor}
                        disabled={button.disabled || false}
                        marginLeft={styles.getButtonMargin(index)}
                        onPress={() => handleButtonPress(button)}
                        showIcon={showIcon}
                      >
                        {showIcon && buttonIconName && (
                          <ButtonIcon>
                            <Icon size={ESize.s20} color={textColor} name={buttonIconName} />
                          </ButtonIcon>
                        )}
                        <ButtonText
                          textColor={textColor}
                          disabled={button.disabled || false}
                          hasIcon={showIcon && !!buttonIconName}
                        >
                          {button.text}
                        </ButtonText>
                      </StyledButton>
                    );
                  })}
                </ButtonsContainer>
              )}
            </ContentContainer>
          </AlertContainer>
        </Overlay>
      );
    };

    return Component;
  }, [alertState, getAlertColors, getThemeColors, handleBackdropPress, handleButtonPress]);

  return {
    showAlert,
    hideAlert,
    alertState,
    AlertComponent,
  };
};
