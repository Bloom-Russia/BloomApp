import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Block, Colors, ERounding, ESpacings, Icon, IconNames, Row, Typography } from '@UIKit';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components';

export interface SelectItem {
  id: string;
  name: string;
}

interface SelectProps {
  placeholder?: string;
  items: SelectItem[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  label?: string;
  errorText?: string;
  isError?: boolean;
  disabled?: boolean;
  marginBottom?: number;
  marginTop?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
}
const keyExtractor = (item: SelectItem) => item.id;

const SelectComponent: React.FC<SelectProps> = ({
  placeholder = 'Выберите значение',
  items,
  selectedValue,
  onSelect,
  label,
  errorText,
  isError,
  disabled = false,
  marginBottom = 0,
  marginTop = 0,
  showSearch = true,
  searchPlaceholder = 'Поиск...',
}) => {
  const [selectedItem, setSelectedItem] = useState<SelectItem | null>(
    selectedValue ? items.find((item) => item.id === selectedValue) || null : null,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '85%'], []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  const handleOpenPress = useCallback(() => {
    if (!disabled) {
      setSearchQuery('');
      bottomSheetRef.current?.expand();
    }
  }, [disabled]);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleSelect = useCallback(
    (item: SelectItem) => {
      setSelectedItem(item);
      onSelect(item.id);
      handleClosePress();
    },
    [onSelect, handleClosePress],
  );

  const getSelectedLabel = useCallback(() => {
    if (selectedItem) {
      return selectedItem.name;
    }
    return placeholder;
  }, [selectedItem, placeholder]);

  const renderItem = useCallback(
    ({ item }: { item: SelectItem }) => (
      <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
        <SelectItem
          padding={ESpacings.s16}
          justifyContent={'space-between'}
          alignItems={'center'}
          backgroundColor={selectedItem?.id === item.id ? Colors.gray : Colors.transparent}
        >
          <Typography.B14 color={Colors.white}>{item.name}</Typography.B14>
          {selectedItem?.id === item.id && <Icon name="check" size={20} color={Colors.primary} />}
        </SelectItem>
      </TouchableOpacity>
    ),
    [selectedItem, handleSelect],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <Block marginBottom={marginBottom} marginTop={marginTop}>
      {label && (
        <Typography.B14 marginBottom={ESpacings.s8} color={Colors.white}>
          {label}
        </Typography.B14>
      )}

      <TouchableOpacity onPress={handleOpenPress} activeOpacity={disabled ? 1 : 0.7}>
        <SelectContainer
          backgroundColor={disabled ? Colors.gray : Colors.black}
          borderRadius={ERounding.r8}
          paddingHorizontal={ESpacings.s12}
          paddingVertical={ESpacings.s14}
          justifyContent={'space-between'}
          alignItems={'center'}
          isError={isError}
        >
          <Typography.R14 color={selectedItem ? Colors.white : Colors.gray}>
            {getSelectedLabel()}
          </Typography.R14>
          <Icon name={IconNames.success} size={20} color={Colors.white} />
        </SelectContainer>
      </TouchableOpacity>

      {isError && (
        <Typography.B14 marginTop={ESpacings.s8} color={Colors.error}>
          {errorText}
        </Typography.B14>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: Colors.gray,
        }}
        handleIndicatorStyle={{
          backgroundColor: Colors.white,
        }}
      >
        <BottomSheetContent>
          <Heading padding={ESpacings.s16} justifyContent={'space-between'} alignItems={'center'}>
            <Typography.B14 color={Colors.white}>{label || 'Выберите значение'}</Typography.B14>
            <TouchableOpacity onPress={handleClosePress}>
              <Icon name={IconNames.cancel} size={24} color={Colors.white} />
            </TouchableOpacity>
          </Heading>

          {showSearch && (
            <Block paddingHorizontal={ESpacings.s16} paddingBottom={ESpacings.s12}>
              <Row
                alignItems={'center'}
                backgroundColor={Colors.black}
                borderRadius={ERounding.r8}
                paddingHorizontal={ESpacings.s12}
                paddingVertical={ESpacings.s8}
              >
                <Icon name={IconNames.fingerprint} size={20} color={Colors.gray} />
                <SearchInput
                  placeholder={searchPlaceholder}
                  placeholderTextColor={Colors.gray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch}>
                    <Icon name={IconNames.cancel} size={20} color={Colors.gray} />
                  </TouchableOpacity>
                )}
              </Row>
            </Block>
          )}

          {filteredItems.length === 0 ? (
            <Block flex={1} justifyContent={'center'} alignItems={'center'} padding={ESpacings.s32}>
              <Icon name={IconNames.faceId} size={48} color={Colors.gray} />
              <Typography.B14 marginTop={ESpacings.s16} color={Colors.gray} textAlign={'center'}>
                Ничего не найдено
              </Typography.B14>
            </Block>
          ) : (
            <BottomSheetFlatList
              data={filteredItems}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: ESpacings.s16,
              }}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </BottomSheetContent>
      </BottomSheet>
    </Block>
  );
};

export const Select = memo(SelectComponent, isEqual);

const Heading = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
});

const SelectItem = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
});

const SelectContainer = styled(Block)<{
  isError?: boolean;
}>(({ isError }) => ({
  borderWidth: 1,
  borderColor: isError ? Colors.red : Colors.white,
  flexDirection: 'row',
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
