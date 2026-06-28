import { Block, Colors, ERounding, ESize, ESpacings, Typography } from '@UIKit';
import React from 'react';
import MaskInput from 'react-native-mask-input';
import styled from 'styled-components';

type MaskInputProps = {
  time: string;
  setTime: (phone: string) => void;
  errorText?: string;
  title?: string;
  marginBottom?: number;
  isError?: boolean;
};

export const MaskedTimeInput: React.FC<MaskInputProps> = ({
  time,
  setTime,
  marginBottom = 0,
  title,
  errorText,
  isError,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <StyledMaskInput
        isError={isError}
        color={Colors.white}
        value={time}
        onChangeText={(_masked, unmasked) => setTime(unmasked)}
        mask={[/[0-2]/, /\d/, ':', /[0-5]/, /\d/]}
        placeholder="чч:мм"
        keyboardType="numeric"
        placeholderTextColor={Colors.white}
        maxLength={5}
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
  paddingHorizontal: ESpacings.s10,
  height: ESize.s48,
  color,
  fontSize: 20,
  width: 80,
}));
