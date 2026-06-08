import React from 'react';
import { ImageSourcePropType, KeyboardTypeOptions, TextInput, TextInputProps } from 'react-native';
import styled from 'styled-components';

import { Colors, ERounding, ESpacings, Typography } from './constants';
import { Block } from './helpers';

type Props = {
  marginBottom?: number;
  onChangeValue: (value: string) => void;
  value: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  title?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  disabled?: boolean;
  maxLength?: number;
  icon?: ImageSourcePropType;
  onIconPress?: () => void;
  error?: string;
};

export const Input: React.FC<Props> = ({
  marginBottom,
  onChangeValue,
  value,
  keyboardType,
  placeholder,
  disabled,
  maxLength,
  autoCapitalize,
  title,
  error,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8} paddingLeft={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <StyledInput
        color={Colors.white}
        placeholderTextColor={Colors.white}
        editable={!disabled}
        onChangeText={onChangeValue}
        value={value}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        underlineColorAndroid="transparent"
      />
      {error ? (
        <Typography.B14
          paddingLeft={ESpacings.s8}
          color={Colors.red}
          marginBottom={ESpacings.s8}
          marginTop={ESpacings.s8}
        >
          {error}
        </Typography.B14>
      ) : null}
    </Block>
  );
};

const StyledInput = styled(TextInput)<{ color: string }>(({ color }) => ({
  borderRadius: ERounding.r14,
  overflow: 'hidden',
  borderColor: Colors.white,
  borderWidth: 1,
  paddingHorizontal: ESpacings.s14,
  fontSize: 14,
  color,
  height: 48,
}));
