import { Colors, ERounding, ESpacings } from '@UIKit';
import { StyleSheet } from 'react-native';

const SMS_CODE_CELL_CONSTANTS = {
  CELL_SIZE: 50,
  LINE_HEIGHT_OFFSET: 5,
  BORDER_WIDTH: 2,
} as const;

export const styles = StyleSheet.create({
  cell: {
    height: SMS_CODE_CELL_CONSTANTS.CELL_SIZE,
    width: SMS_CODE_CELL_CONSTANTS.CELL_SIZE,
    lineHeight:
      SMS_CODE_CELL_CONSTANTS.CELL_SIZE -
      SMS_CODE_CELL_CONSTANTS.LINE_HEIGHT_OFFSET,
    borderRadius: ERounding.r12,
    backgroundColor: Colors.white,
    borderWidth: SMS_CODE_CELL_CONSTANTS.BORDER_WIDTH,
    borderColor: Colors.black,
    marginHorizontal: ESpacings.s8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
