import { Block, Colors, ERounding, ESpacings, Icon, IconNames, Typography } from '@UIKit';
import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import { ScrollView, TouchableOpacity } from 'react-native';
import styled from 'styled-components';

export type MultiSelectItem = {
  id: string;
  name: string;
};

interface MultiSelectProps {
  placeholder?: string;
  items: MultiSelectItem[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  label?: string;
  disabled?: boolean;
  marginBottom?: number;
  marginTop?: number;
  isError?: boolean;
  errorText?: string;
  onPress?: () => void;
}

const MultiSelectComponent: React.FC<MultiSelectProps> = ({
  placeholder = 'Выберите значения',
  items,
  selectedValues,
  onSelect,
  label,
  errorText,
  disabled = false,
  marginBottom = 0,
  marginTop = 0,
  isError,
  onPress,
}) => {
  const getSelectedLabels = useCallback(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    const selectedItems = items.filter((item) => selectedValues.includes(item.id));
    if (selectedItems.length <= 2) {
      return selectedItems.map((item) => item.name).join(', ');
    }

    return `${selectedItems.length} выбрано`;
  }, [selectedValues, items, placeholder]);

  const handleRemoveTag = useCallback(
    (itemId: string) => {
      onSelect(selectedValues.filter((id) => id !== itemId));
    },
    [selectedValues, onSelect],
  );

  return (
    <Block marginBottom={marginBottom} marginTop={marginTop}>
      {label && (
        <Typography.B14 marginBottom={ESpacings.s8} color={Colors.white}>
          {label}
        </Typography.B14>
      )}

      <TouchableOpacity onPress={() => !disabled && onPress?.()} activeOpacity={disabled ? 1 : 0.7}>
        <SelectContainer
          backgroundColor={disabled ? Colors.gray : Colors.black}
          borderRadius={8}
          paddingHorizontal={ESpacings.s12}
          paddingVertical={ESpacings.s14}
          justifyContent="space-between"
          alignItems="center"
          isError={isError}
        >
          <Typography.R14
            color={selectedValues.length > 0 ? Colors.white : Colors.gray}
            numberOfLines={1}
          >
            {getSelectedLabels()}
          </Typography.R14>
          <Icon name={IconNames.chevronDown} size={20} color={Colors.white} />
        </SelectContainer>
      </TouchableOpacity>

      {isError && errorText && (
        <Typography.B14 marginTop={ESpacings.s4} color={Colors.error}>
          {errorText}
        </Typography.B14>
      )}

      {selectedValues.length > 0 && (
        <TagsContainer horizontal showsHorizontalScrollIndicator={false}>
          {items
            .filter((item) => selectedValues.includes(item.id))
            .map((item) => (
              <Tag key={item.id} onPress={() => handleRemoveTag(item.id)}>
                <Typography.B14 color={Colors.white} numberOfLines={1}>
                  {item.name}
                </Typography.B14>
                <Typography.B16 marginLeft={ESpacings.s4} color={Colors.white}>
                  ✕
                </Typography.B16>
              </Tag>
            ))}
        </TagsContainer>
      )}
    </Block>
  );
};

export const MultiSelect = memo(MultiSelectComponent, isEqual);

const SelectContainer = styled(Block)<{ isError?: boolean }>(({ isError }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.error : Colors.white,
  flexDirection: 'row',
}));

const TagsContainer = styled(ScrollView)({
  flexDirection: 'row',
  marginTop: ESpacings.s8,
  maxHeight: 40,
});

const Tag = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.primary,
  borderRadius: ERounding.r16,
  paddingHorizontal: ESpacings.s12,
  paddingVertical: ESpacings.s6,
  marginRight: ESpacings.s8,
});
