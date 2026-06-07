// @UIKit/components/Avatar/index.tsx
import { Block, Colors, Typography } from '@UIKit';
import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export interface AvatarProps {
  /** URL или локальный путь к изображению */
  source?: string | { uri: string } | null;
  /** Размер аватара */
  size?: number;
  /** Имя для инициалов (если нет изображения) */
  name?: string;
  /** Плейсхолдер (текст или emoji) */
  placeholder?: string;
  /** Обработчик нажатия */
  onPress?: () => void;
  /** Режим редактирования (показывает оверлей) */
  editable?: boolean;
  /** Цвет фона для плейсхолдера */
  backgroundColor?: string;
  /** Цвет текста для инициалов */
  textColor?: string;
  /** Стиль контейнера */
  containerStyle?: ViewStyle;
  /** Стиль изображения */
  imageStyle?: ViewStyle;
  /** Показывать индикатор загрузки */
  loading?: boolean;
  /** Обработчик ошибки загрузки */
  onError?: () => void;
  /** Граница */
  borderWidth?: number;
  /** Цвет границы */
  borderColor?: string;
  /** Тень */
  shadow?: boolean;
}

const AvatarComponent: React.FC<AvatarProps> = ({
  source,
  size = 80,
  name,
  placeholder = '👤',
  onPress,
  editable = false,
  backgroundColor = Colors.gray,
  textColor = Colors.white,
  containerStyle,
  imageStyle,
  loading: externalLoading,
  onError,
  borderWidth = 0,
  borderColor = Colors.primary,
  shadow = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const showPlaceholder = !source || hasError;

  // Получение инициалов из имени
  const getInitials = useCallback(() => {
    if (!name) {
      return placeholder;
    }

    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }

    return placeholder;
  }, [name, placeholder]);

  // Получение источника изображения
  const getImageSource = useCallback(() => {
    if (!source) {
      return null;
    }

    if (typeof source === 'string') {
      if (source.startsWith('http') || source.startsWith('https')) {
        return { uri: source };
      }
      return { uri: source };
    }

    return source;
  }, [source]);

  // Обработка начала загрузки
  const handleLoadStart = useCallback(() => {
    setInternalLoading(true);
    setHasError(false);
  }, []);

  // Обработка окончания загрузки
  const handleLoadEnd = useCallback(() => {
    setInternalLoading(false);
  }, []);

  // Обработка ошибки загрузки
  const handleError = useCallback(() => {
    setInternalLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const containerSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={Colors.primary} />;
    }

    if (!showPlaceholder && getImageSource()) {
      return (
        <Image
          source={getImageSource()}
          style={[styles.image, { width: size, height: size }, imageStyle]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode="cover"
        />
      );
    }

    // Плейсхолдер с инициалами или emoji
    const initials = getInitials();

    return (
      <Block
        justifyContent={'center'}
        alignItems={'center'}
        style={[
          styles.placeholder,
          {
            backgroundColor,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Typography.B16 color={textColor} textAlign={'center'}>
          {initials}
        </Typography.B16>
      </Block>
    );
  };

  const renderEditOverlay = () => {
    if (!editable) {
      return null;
    }

    return (
      <Block
        position={'absolute'}
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius={size / 2}
        backgroundColor={'rgba(0, 0, 0, 0.5)'}
        justifyContent={'center'}
        alignItems={'center'}
        style={styles.editOverlay}
      >
        <Typography.B16 fontSize={size / 3} color={Colors.white}>
          ✏️
        </Typography.B16>
        <Typography.B14 color={Colors.white} marginTop={4}>
          Изменить
        </Typography.B14>
      </Block>
    );
  };

  const containerStyles = [
    containerSize,
    styles.container,
    shadow && styles.shadow,
    borderWidth > 0 && {
      borderWidth,
      borderColor,
    },
    containerStyle,
  ];

  const avatarContent = (
    <View style={containerStyles}>
      {renderContent()}
      {renderEditOverlay()}
    </View>
  );

  if (onPress || editable) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress && !editable}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    borderRadius: '50%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
  },
  shadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export const Avatar = memo(AvatarComponent, isEqual);
