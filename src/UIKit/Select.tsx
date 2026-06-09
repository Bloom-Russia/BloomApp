// Select.tsx
import { Block, Colors, ERounding, ESpacings, Icon, IconNames, Typography } from '@UIKit';
import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components';

export interface SelectItem {
  id: string;
  name: string;
}

interface SelectProps {
  placeholder?: string;
  selectedValue: string | null;
  onSelect: () => void;
  label?: string;
  errorText?: string;
  isError?: boolean;
  disabled?: boolean;
  marginBottom?: number;
  marginTop?: number;
}

const SelectComponent: React.FC<SelectProps> = ({
  placeholder = 'Выберите значение',
  selectedValue,
  onSelect,
  label,
  errorText,
  isError,
  disabled = false,
  marginBottom = 0,
  marginTop = 0,
}) => {
  const getSelectedLabel = useCallback(() => {
    // Этот компонент теперь только отображает выбранное значение
    // Актуальное значение приходит через пропс selectedValue
    return selectedValue || placeholder;
  }, [selectedValue, placeholder]);

  return (
    <Block marginBottom={marginBottom} marginTop={marginTop}>
      {label && (
        <Typography.B14 marginBottom={ESpacings.s8} color={Colors.white}>
          {label}
        </Typography.B14>
      )}

      <TouchableOpacity onPress={onSelect} activeOpacity={disabled ? 1 : 0.7}>
        <SelectContainer
          backgroundColor={disabled ? Colors.gray : Colors.black}
          borderRadius={ERounding.r8}
          paddingHorizontal={ESpacings.s12}
          paddingVertical={ESpacings.s14}
          justifyContent={'space-between'}
          alignItems={'center'}
          isError={isError}
        >
          <Typography.R14 color={selectedValue ? Colors.white : Colors.gray}>
            {getSelectedLabel()}
          </Typography.R14>
          <Icon name={IconNames.success} size={20} color={Colors.white} />
        </SelectContainer>
      </TouchableOpacity>

      {isError && errorText && (
        <Typography.B14 marginTop={ESpacings.s8} color={Colors.error}>
          {errorText}
        </Typography.B14>
      )}
    </Block>
  );
};

export const Select = memo(SelectComponent, isEqual);

const SelectContainer = styled(Block)<{
  isError?: boolean;
}>(({ isError }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.red : Colors.white,
  flexDirection: 'row',
}));
