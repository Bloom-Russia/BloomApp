import { Block, Colors, ERounding, ESize, ESpacings, Typography } from '@UIKit';
import React from 'react';
import { TextInputProps } from 'react-native';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

type MaskInputProps = {
  phone: string;
  setPhone: (phone: string) => void;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  isError?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
};

export const MaskedInput: React.FC<MaskInputProps> = ({
  phone,
  setPhone,
  marginBottom = 0,
  title,
  errorText,
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
      <StyledMaskInput
        autoComplete={autoComplete}
        isError={isError}
        color={Colors.white}
        value={phone}
        onChangeText={(_masked, unmasked) => setPhone(unmasked)}
        mask={[
          '+',
          '7',
          ' ',
          '(',
          /\d/,
          /\d/,
          /\d/,
          ')',
          ' ',
          /\d/,
          /\d/,
          /\d/,
          '-',
          /\d/,
          /\d/,
          '-',
          /\d/,
          /\d/,
        ]}
        placeholder="+7 (___) ___-__-__"
        keyboardType="numeric"
        placeholderTextColor={Colors.white}
      />
      {isError ? (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {errorText}
        </Typography.B14>
      ) : null}
    </Block>
  );
};

const StyledMaskInput = styled(MaskInput)<{
  color: string;
  isError?: boolean;
}>(({ isError, color }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.red : Colors.white,
  borderRadius: ERounding.r14,
  paddingHorizontal: ESpacings.s16,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
