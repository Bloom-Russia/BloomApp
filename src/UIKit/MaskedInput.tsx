import { Block, Colors, ERounding, ESize, ESpacings, Typography } from '@UIKit';
import React from 'react';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

type MaskInputProps = {
  phone: string;
  setPhone: (phone: string) => void;
  error?: string;
  title?: string;
  marginBottom?: number;
};

export const MaskedInput: React.FC<MaskInputProps> = ({
  phone,
  setPhone,
  marginBottom = 0,
  title,
  error,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <StyledMaskInput
        error={!!error}
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
      {error ? (
        <Typography.B14 color={Colors.red} marginBottom={ESpacings.s8} marginTop={ESpacings.s8}>
          {error}
        </Typography.B14>
      ) : null}
    </Block>
  );
};

const StyledMaskInput = styled(MaskInput)<{
  color: string;
  error?: boolean;
}>(({ error, color }) => ({
  borderWidth: 1,
  borderColor: error ? Colors.red : Colors.white,
  borderRadius: ERounding.r14,
  paddingHorizontal: ESpacings.s16,
  height: ESize.s48,
  color,
  fontSize: 20,
}));
