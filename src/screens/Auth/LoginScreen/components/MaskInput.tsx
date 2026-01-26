import { Colors, ERounding, ESize, ESpacings } from '@UIKit';
import React from 'react';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

type MaskInputProps = {
  phone: string;
  setPhone: (phone: string) => void;
};

export const MaskedInput: React.FC<MaskInputProps> = ({ phone, setPhone }) => {
  return (
    <StyledMaskInput
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
  );
};

const StyledMaskInput = styled(MaskInput)({
  borderWidth: 1,
  borderColor: Colors.white,
  borderRadius: ERounding.r12,
  paddingHorizontal: ESpacings.s16,
  height: ESize.s48,
  color: Colors.white,
  fontSize: 20,
});
