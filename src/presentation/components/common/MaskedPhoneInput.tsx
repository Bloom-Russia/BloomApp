import { Colors } from '@core/styles/Colors';
import { ERounding, ESize, ESpacings } from '@core/styles/Spacings';
import React from 'react';
import { TextInputProps } from 'react-native';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

import { Block } from './Block';
import { Typography } from './Typography';

type MaskedPhoneInputProps = {
  phone: string;
  setPhone: (phone: string) => void;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  isError?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  required?: boolean;
};

export const MaskedPhoneInput: React.FC<MaskedPhoneInputProps> = ({
  phone,
  setPhone,
  marginBottom = 0,
  title,
  errorText,
  isError,
  autoComplete,
  required,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
          {required ? (
            <Typography.B16 color={Colors.error} marginBottom={ESpacings.s8}>
              {` *`}
            </Typography.B16>
          ) : null}
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
        placeholderTextColor={Colors.textSecondary}
      />

      {isError && errorText ? (
        <Typography.B14 color={Colors.error} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
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
  borderColor: isError ? Colors.error : Colors.white,
  borderRadius: ERounding.r14,
  paddingHorizontal: ESpacings.s16,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
