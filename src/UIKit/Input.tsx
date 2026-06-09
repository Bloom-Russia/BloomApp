import React from 'react';
import { KeyboardTypeOptions, TextInput, TextInputProps } from 'react-native';
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
  autoComplete?: TextInputProps['autoComplete'];
  disabled?: boolean;
  maxLength?: number;
  errorText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  height?: number;
  textAlignVertical?: string;
  isError?: boolean;
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
  errorText,
  multiline,
  numberOfLines = 1,
  height = 48,
  textAlignVertical = 'center',
  isError,
  autoComplete,
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
        autoComplete={autoComplete}
        isError={isError}
      />
      {isError ? (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {errorText}
        </Typography.B14>
      ) : null}
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
  borderColor: isError ? Colors.red : Colors.white,
  borderWidth: 1,
  paddingHorizontal: ESpacings.s14,
  fontSize: 14,
  color,
  height: height,
  textAlignVertical: textAlignVertical,
}));
