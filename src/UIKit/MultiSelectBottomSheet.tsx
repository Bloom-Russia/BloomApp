import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import {
  Block,
  Button,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  Row,
  Typography,
} from '@UIKit';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { MultiSelectItem } from './MultiSelect';

interface MultiSelectBottomSheetProps {
  visible: boolean;
  label?: string;
  items: MultiSelectItem[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  selectedValues: string[];
  onConfirm: (values: string[]) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  maxSelected?: number;
}

const keyExtractor = (item: MultiSelectItem) => item.id;

export const MultiSelectBottomSheet: React.FC<MultiSelectBottomSheetProps> = memo(
  ({
    visible,
    label,
    items,
    searchQuery,
    onSearchChange,
    selectedValues,
    onConfirm,
    onClose,
    searchPlaceholder = 'Поиск...',
    showSearch = true,
    maxSelected,
  }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%', '80%'], []);
    const [isClosing, setIsClosing] = useState(false);
    const [tempSelectedValues, setTempSelectedValues] = useState<string[]>(selectedValues);

    useEffect(() => {
      if (visible) {
        setIsClosing(false);
        setTempSelectedValues(selectedValues);
        setTimeout(() => {
          bottomSheetRef.current?.expand();
        }, 50);
      } else if (!isClosing) {
        bottomSheetRef.current?.close();
      }
    }, [visible, isClosing, selectedValues]);

    const handleClose = useCallback(() => {
      setIsClosing(true);
      Keyboard.dismiss();
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    }, [onClose]);

    const handleConfirm = useCallback(() => {
      Keyboard.dismiss();
      onConfirm(tempSelectedValues);
    }, [tempSelectedValues, onConfirm]);

    const handleToggle = useCallback(
      (itemId: string) => {
        setTempSelectedValues((prev) => {
          if (prev.includes(itemId)) {
            return prev.filter((id) => id !== itemId);
          } else {
            if (maxSelected && prev.length >= maxSelected) {
              return prev;
            }
            return [...prev, itemId];
          }
        });
      },
      [maxSelected],
    );

    const handleClearAll = useCallback(() => {
      setTempSelectedValues([]);
    }, []);

    const isSelected = useCallback(
      (itemId: string) => tempSelectedValues.includes(itemId),
      [tempSelectedValues],
    );

    const isMaxReached = useCallback(() => {
      if (!maxSelected) {
        return false;
      }
      return tempSelectedValues.length >= maxSelected;
    }, [tempSelectedValues, maxSelected]);

    const clearSearch = useCallback(() => {
      onSearchChange('');
    }, [onSearchChange]);

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1 && !isClosing && visible) {
          handleClose();
        }
      },
      [handleClose, isClosing, visible],
    );

    const renderItem = useCallback(
      ({ item }: { item: MultiSelectItem }) => {
        const selected = isSelected(item.id);
        const disabled = !selected && isMaxReached();

        return (
          <TouchableOpacity
            onPress={() => handleToggle(item.id)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <StyledItem
              paddingHorizontal={ESpacings.s16}
              paddingVertical={ESpacings.s16}
              justifyContent={'space-between'}
              alignItems={'center'}
              opacity={disabled ? 0.5 : 1}
            >
              <Typography.B14 color={selected ? Colors.primary : Colors.white}>
                {item.name}
              </Typography.B14>
              <Checkbox>
                {selected && <Icon name={IconNames.checked} size={16} color={Colors.primary} />}
              </Checkbox>
            </StyledItem>
          </TouchableOpacity>
        );
      },
      [isSelected, handleToggle, isMaxReached],
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: Colors.gray,
        }}
        handleIndicatorStyle={{
          backgroundColor: Colors.white,
        }}
        onChange={handleSheetChange}
        onClose={handleClose}
      >
        <BottomSheetContent>
          <Heading
            paddingHorizontal={ESpacings.s16}
            paddingVertical={ESpacings.s16}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            <Typography.B14 color={Colors.white}>{label || 'Выберите значения'}</Typography.B14>
            <TouchableOpacity onPress={handleClose}>
              <Icon name={IconNames.cancel} size={ESize.s32} color={Colors.white} />
            </TouchableOpacity>
          </Heading>

          {maxSelected && (
            <CounterBlock paddingHorizontal={ESpacings.s16} paddingBottom={ESpacings.s8}>
              <Typography.B14 color={Colors.gray}>
                Выбрано: {tempSelectedValues.length} {maxSelected && `/ ${maxSelected}`}
              </Typography.B14>
              {tempSelectedValues.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Typography.B14 color={Colors.error}>Очистить все</Typography.B14>
                </TouchableOpacity>
              )}
            </CounterBlock>
          )}

          {showSearch && (
            <Block paddingHorizontal={ESpacings.s16} paddingBottom={ESpacings.s12}>
              <Row
                alignItems={'center'}
                backgroundColor={Colors.black}
                borderRadius={8}
                paddingHorizontal={ESpacings.s12}
                paddingVertical={ESpacings.s8}
              >
                <Icon name={IconNames.search} size={20} color={Colors.gray} />
                <SearchInput
                  autoComplete={'off'}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={Colors.gray}
                  value={searchQuery}
                  onChangeText={onSearchChange}
                  autoFocus={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch}>
                    <Icon name={IconNames.cancel} size={ESize.s32} color={Colors.gray} />
                  </TouchableOpacity>
                )}
              </Row>
            </Block>
          )}

          {items.length === 0 ? (
            <Block flex={1} justifyContent={'center'} alignItems={'center'} padding={ESpacings.s32}>
              <Icon name={IconNames.search} size={48} color={Colors.gray} />
              <Typography.B14 marginTop={ESpacings.s16} color={Colors.gray} textAlign={'center'}>
                Ничего не найдено
              </Typography.B14>
            </Block>
          ) : (
            <BottomSheetFlatList
              data={items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: ESpacings.s16,
              }}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}

          <ButtonBlock padding={ESpacings.s16} justifyContent={'space-between'}>
            <Button
              paddingHorizontal={ESpacings.s16}
              onPress={handleClose}
              title={'Отмена'}
              color={Colors.error}
            />
            <Button
              paddingHorizontal={ESpacings.s16}
              onPress={handleConfirm}
              title={`Готово ${tempSelectedValues.length}`}
              color={Colors.primary}
            />
          </ButtonBlock>
        </BottomSheetContent>
      </BottomSheet>
    );
  },
);

const Heading = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
});

const StyledItem = styled(Row)<{ opacity?: number }>(({ opacity }) => ({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
  opacity: opacity ?? 1,
}));

const BottomSheetContent = styled(Block)({
  flex: 1,
});

const SearchInput = styled(TextInput)({
  color: Colors.white,
  fontSize: 14,
  marginLeft: ESpacings.s8,
  padding: 0,
  flex: 1,
});

const CounterBlock = styled(Row)({
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ButtonBlock = styled(Row)({
  borderTopWidth: 1,
  borderTopColor: Colors.white,
});

const Checkbox = styled(Block)({
  width: 20,
  height: 20,
  borderRadius: ERounding.r4,
  borderWidth: 2,
  borderColor: Colors.white,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: Colors.white,
});
