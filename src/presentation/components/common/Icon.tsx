import { IconName, IconNames, selection } from '@core/assets';
import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { IconProps as VectorIconProps } from 'react-native-vector-icons/Icon';

const IconSet = createIconSetFromIcoMoon(selection);

export interface IconProps extends Omit<VectorIconProps, 'name'> {
  /** Имя иконки */
  name: IconName | IconNames;
  /** Размер иконки */
  size?: number;
  /** Цвет иконки */
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ size = 24, name, color, style, ...rest }) => {
  return (
    <IconSet
      name={name}
      size={size}
      color={color}
      style={[{ lineHeight: size }, style]}
      {...rest}
    />
  );
};
