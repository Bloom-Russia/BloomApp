import { Colors, Typography } from '@UIKit';
import React from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { styles } from './SmsCodeCell.styles';
import { AnimatedCursor } from './AnimatedCursor';

type Props = {
  index: number;
  symbol: string;
  isFocused: boolean;
  getCellOnLayoutHandler: (index: number) => (event: LayoutChangeEvent) => void;
  errorResponse: boolean;
};

export const SmsCodeCell: React.FC<Props> = ({
  index,
  symbol,
  isFocused,
  getCellOnLayoutHandler,
  errorResponse,
}) => {
  const renderCellContent = () => {
    if (symbol) {
      return (
        <Typography.B14 color={errorResponse ? Colors.ripple : Colors.black}>
          {symbol}
        </Typography.B14>
      );
    }

    if (isFocused) {
      return <AnimatedCursor />;
    }

    return null;
  };

  return (
    <View
      key={index}
      style={styles.cell}
      onLayout={getCellOnLayoutHandler(index)}
    >
      {renderCellContent()}
    </View>
  );
};
