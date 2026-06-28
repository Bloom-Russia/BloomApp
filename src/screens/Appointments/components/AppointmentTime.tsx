import {
  Block,
  Colors,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  MaskedTimeInput,
  Row,
  Typography,
} from '@UIKit';
import React from 'react';
import { Pressable } from 'react-native';

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
  // Показать DateTimePicker
  const onRequestOpen = () => {
    return null;
  };

  return (
    <Block marginBottom={marginBottom}>
      {title ? (
        <Typography.B14 color={Colors.white} marginBottom={ESpacings.s8}>
          {title}
        </Typography.B14>
      ) : null}
      <Row alignItems={'center'}>
        <Row alignItems={'center'}>
          <MaskedTimeInput
            time={startTime}
            setTime={(v) => {
              setStartTime(v);
              setTimeError?.(false);
            }}
          />
          <Block marginLeft={ESpacings.s8}>
            <Pressable onPress={onRequestOpen}>
              <Icon color={Colors.white} size={ESize.s24} name={IconNames.clock} />
            </Pressable>
          </Block>
        </Row>
        <Typography.B14 paddingHorizontal={ESpacings.s12} color={Colors.white}>
          -
        </Typography.B14>
        <Row alignItems={'center'}>
          <MaskedTimeInput
            time={finishTime}
            setTime={(v) => {
              setFinishTime(v);
              setTimeError?.(false);
            }}
          />
          <Block marginLeft={ESpacings.s8}>
            <Pressable onPress={onRequestOpen}>
              <Icon color={Colors.white} size={ESize.s24} name={IconNames.clock} />
            </Pressable>
          </Block>
        </Row>
      </Row>
      {isError && timeErrorText ? (
        <Typography.B14 color={Colors.red} marginTop={ESpacings.s4}>
          {timeErrorText}
        </Typography.B14>
      ) : null}
    </Block>
  );
};
