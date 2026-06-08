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
  multiline?: boolean;
  numberOfLines?: number;
  height?: number;
  textAlignVertical?: string;
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
  multiline,
  numberOfLines = 1,
  height = 48,
  textAlignVertical = 'center',
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <StyledInput
        textAlignVertical={textAlignVertical}
        height={height}
        numberOfLines={numberOfLines}
        multiline={multiline}
        color={Colors.white}
        placeholderTextColor={Colors.gray}
        editable={!disabled}
        onChangeText={onChangeValue}
        value={value}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoComplete="off"
        error={!!error}
      />
      {error ? (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {error}
        </Typography.B14>
      ) : null}
    </Block>
  );
};

const StyledInput = styled(TextInput)<{
  color: string;
  height: number;
  textAlignVertical: string;
  error?: boolean;
}>(({ color, height, textAlignVertical, error }) => ({
  borderRadius: ERounding.r14,
  overflow: 'hidden',
  borderColor: error ? Colors.red : Colors.white,
  borderWidth: 1,
  paddingHorizontal: ESpacings.s14,
  fontSize: 14,
  color,
  height: height,
  textAlignVertical: textAlignVertical,
}));
