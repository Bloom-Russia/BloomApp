import { Block, Colors, ESpacings, MaskedTimeInput, Row, Typography } from '@UIKit';
import React from 'react';

type AppointmentTimeProps = {
  title?: string;
  startTime: string;
  finishTime: string;
  setStartTime: (time: string) => void;
  setFinishTime: (time: string) => void;
  setTimeError?: (error: boolean) => void;
  timeErrorText?: string;
  isError?: boolean;
  marginBottom?: ESpacings;
};

export const AppointmentTime: React.FC<AppointmentTimeProps> = ({
  title,
  startTime,
  finishTime,
  setStartTime,
  setFinishTime,
  setTimeError,
  timeErrorText,
  marginBottom = ESpacings.s12,
  isError,
}) => {
  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <Row alignItems={'center'}>
        <Typography.B14 marginRight={ESpacings.s12} color={Colors.white}>
          с
        </Typography.B14>
        <MaskedTimeInput
          time={startTime}
          setTime={(v) => {
            setStartTime(v);
            setTimeError?.(false);
          }}
        />
        <Typography.B14 paddingHorizontal={ESpacings.s12} color={Colors.white}>
          до
        </Typography.B14>
        <MaskedTimeInput
          time={finishTime}
          setTime={(v) => {
            setFinishTime(v);
            setTimeError?.(false);
          }}
        />
      </Row>
      {isError && timeErrorText ? (
        <Typography.B14 color={Colors.red} marginTop={ESpacings.s4}>
          {timeErrorText}
        </Typography.B14>
      ) : null}
    </Block>
  );
};
