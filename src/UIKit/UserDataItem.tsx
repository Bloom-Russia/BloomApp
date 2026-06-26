import React from 'react';
import { Colors, ESpacings, Typography } from './constants';
import { Block } from './helpers';

type Props = {
  value: string | null | undefined;
  label: string;
  marginBottom?: number;
};

export const UserDataItem: React.FC<Props> = ({ label, value, marginBottom }) => {
  return (
    <>
      {value ? (
        <Block marginBottom={marginBottom}>
          <Typography.B16 marginBottom={ESpacings.s4} color={Colors.gray}>
            {label}
          </Typography.B16>
          <Typography.B16 color={Colors.white}>{value}</Typography.B16>
        </Block>
      ) : null}
    </>
  );
};
