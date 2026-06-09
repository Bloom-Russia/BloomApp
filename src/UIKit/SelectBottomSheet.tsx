import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import {
  Block,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Icon,
  IconNames,
  Row,
  SelectItem,
  Typography,
} from '@UIKit';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components';

interface SelectBottomSheetProps {
  visible: boolean;
  label?: string;
  items: SelectItem[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  selectedItem: SelectItem | null;
  onSelect: (item: SelectItem) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const keyExtractor = (item: SelectItem) => item.id;

export const SelectBottomSheet: React.FC<SelectBottomSheetProps> = memo(
  ({
    visible,
    label,
    items,
    searchQuery,
    onSearchChange,
    selectedItem,
    onSelect,
    onClose,
    searchPlaceholder = 'Поиск...',
    showSearch = true,
  }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['40%', '70%'], []);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
      if (visible) {
        setIsClosing(false);
        // Небольшая задержка перед открытием для плавности
        setTimeout(() => {
          bottomSheetRef.current?.expand();
        }, 50);
      } else if (!isClosing) {
        bottomSheetRef.current?.close();
      }
    }, [visible, isClosing]);

    const handleClose = useCallback(() => {
      setIsClosing(true);
      Keyboard.dismiss();
      // Даем время на анимацию закрытия
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    }, [onClose]);

    const handleSelect = useCallback(
      (item: SelectItem) => {
        Keyboard.dismiss();
        onSelect(item);
      },
      [onSelect],
    );

    const clearSearch = useCallback(() => {
      onSearchChange('');
    }, [onSearchChange]);

    const handleSheetChange = useCallback(
      (index: number) => {
        // Если bottomSheet закрыт полностью (index = -1) и не в процессе закрытия
        if (index === -1 && !isClosing && visible) {
          handleClose();
        }
      },
      [handleClose, isClosing, visible],
    );

    const renderItem = useCallback(
      ({ item }: { item: SelectItem }) => (
        <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
          <StyledItem
            paddingHorizontal={ESpacings.s16}
            paddingVertical={ESpacings.s16}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            <Typography.B14 color={selectedItem?.id === item.id ? Colors.primary : Colors.white}>
              {item.name}
            </Typography.B14>
            <Checkbox>
              {selectedItem?.id === item.id && (
                <Icon name={IconNames.checked} size={16} color={Colors.primary} />
              )}
            </Checkbox>
          </StyledItem>
        </TouchableOpacity>
      ),
      [selectedItem, handleSelect],
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
        <Block flex={1}>
          <Heading
            paddingHorizontal={ESpacings.s16}
            paddingVertical={ESpacings.s16}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            <Typography.B14 color={Colors.white}>{label || 'Выберите значение'}</Typography.B14>
            <TouchableOpacity onPress={handleClose}>
              <Icon name={IconNames.cancel} size={ESize.s32} color={Colors.white} />
            </TouchableOpacity>
          </Heading>

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
        </Block>
      </BottomSheet>
    );
  },
);

const Heading = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
});

const StyledItem = styled(Row)({
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray,
});

const SearchInput = styled(TextInput)({
  color: Colors.white,
  fontSize: 14,
  marginLeft: ESpacings.s8,
  padding: 0,
  flex: 1,
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
