import { Colors, ERounding, ESpacings } from '@core/styles';
import React from 'react';
import { KeyboardTypeOptions, TextInput, TextInputProps } from 'react-native';
import styled from 'styled-components';

import { Block } from './Block';
import { Typography } from './Typography';

interface InputProps {
  marginBottom?: number;
  onChangeValue: (value: string) => void;
  value: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  title?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  disabled?: boolean;
  maxLength?: number;
  errorText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  height?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  isError?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  marginBottom,
  onChangeValue,
  value,
  keyboardType,
  placeholder,
  disabled,
  maxLength,
  autoCapitalize = 'none',
  title,
  errorText,
  multiline,
  numberOfLines = 1,
  height = 48,
  textAlignVertical = 'center',
  isError,
  autoComplete,
  required,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title && (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
          {required ? (
            <Typography.B16 color={Colors.error} marginBottom={ESpacings.s8}>
              {` *`}
            </Typography.B16>
          ) : null}
        </Typography.B14>
      )}

      <StyledInput
        textAlignVertical={textAlignVertical}
        height={height}
        numberOfLines={numberOfLines}
        multiline={multiline}
        color={Colors.white}
        placeholderTextColor={Colors.textSecondary}
        editable={!disabled}
        onChangeText={onChangeValue}
        value={value}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoComplete={autoComplete}
        isError={isError}
      />

      {isError && errorText && (
        <Typography.B14 color={Colors.error} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {errorText}
        </Typography.B14>
      )}
    </Block>
  );
};

const StyledInput = styled(TextInput)<{
  color: string;
  height: number;
  textAlignVertical: string;
  isError?: boolean;
}>(({ color, height, textAlignVertical, isError }) => ({
  borderRadius: ERounding.r14,
  overflow: 'hidden',
  borderColor: isError ? Colors.error : Colors.white,
  borderWidth: 1,
  paddingHorizontal: ESpacings.s14,
  fontSize: 14,
  color,
  height,
  textAlignVertical,
}));
