import React, { useImperativeHandle } from "react";
import {
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";

import { SmsCodeCell } from "./components/SmsCodeCell";

const CELL_COUNT = 4;

type Props = {
  value: string;
  setValue: (value: string) => void;
  errorResponse: boolean;
};

export type ICodeFieldComponent = {
  clear: () => void;
};

export const CodeFieldComponent = React.forwardRef<ICodeFieldComponent, Props>(
  ({ value, setValue, errorResponse }, ref) => {
    const refCodeField = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
      value,
      setValue,
    });

    useImperativeHandle(ref, () => ({
      clear: () => {
        setValue("");
        refCodeField.current?.clear();
      },
    }));

    const renderCell = ({
      index,
      symbol,
      isFocused,
    }: {
      index: number;
      symbol: string;
      isFocused: boolean;
    }) => (
      <SmsCodeCell
        errorResponse={errorResponse}
        key={index.toString()}
        getCellOnLayoutHandler={getCellOnLayoutHandler}
        index={index}
        symbol={symbol}
        isFocused={isFocused}
      />
    );

    return (
      <CodeField
        ref={refCodeField}
        {...props}
        value={value}
        onChangeText={setValue}
        cellCount={CELL_COUNT}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={renderCell}
        rootStyle={{
          justifyContent: "center",
        }}
      />
    );
  },
);
