import React from 'react';
import {
  ImageSourcePropType,
  KeyboardTypeOptions,
  TextInput,
  TextInputProps,
} from 'react-native';
import styled from 'styled-components';

import { Colors, ERounding, ESpacings } from './constants';
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
  error?: boolean;
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
}) => {
  return (
    <Block marginBottom={marginBottom}>
      <StyledInput
        color={Colors.black}
        placeholderTextColor={Colors.black}
        editable={!disabled}
        onChangeText={onChangeValue}
        value={value}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
    </Block>
  );
};

const StyledInput = styled(TextInput)<{ color: string }>(({ color }) => ({
  borderRadius: ERounding.r14,
  overflow: 'hidden',
  borderColor: Colors.black,
  borderWidth: 1,
  paddingHorizontal: ESpacings.s14,
  fontSize: 14,
  color,
  height: 48,
}));
