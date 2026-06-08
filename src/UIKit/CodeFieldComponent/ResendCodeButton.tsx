import { useTimoutTimer } from '@hooks';
import { Button, Colors, ESpacings, Typography } from '@UIKit';
import React from 'react';

type ResendCodeButtonProps = {
  startTimeInMillis: number;
  timeout: number;
  resendCode: () => void;
  loading?: boolean;
};

export const ResendCodeButton: React.FC<ResendCodeButtonProps> = React.memo(
  ({ startTimeInMillis, timeout, resendCode, loading }) => {
    const count = useTimoutTimer(startTimeInMillis, timeout);

    if (count === 0) {
      return (
        <Button
          loading={loading}
          textColor={Colors.black}
          color={Colors.white}
          marginTop={ESpacings.s12}
          title={'Запросить новый код'}
          onPress={resendCode}
        />
      );
    }

    return (
      <Typography.B14 marginTop={ESpacings.s16} textAlign="center" color={Colors.white}>
        Получить новый код можно через {count} сек
      </Typography.B14>
    );
  },
);
