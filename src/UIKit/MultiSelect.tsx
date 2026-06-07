import { Block, Colors, ESpacings, Icon, Typography } from '@UIKit';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MultiSelectItem {
  id: string;
  name: string;
}

interface MultiSelectProps {
  placeholder?: string;
  items: MultiSelectItem[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  marginBottom?: number;
  marginTop?: number;
  maxSelected?: number;
}

const MultiSelectComponent: React.FC<MultiSelectProps> = ({
  placeholder = 'Выберите значения',
  items,
  selectedValues,
  onSelect,
  label,
  error,
  disabled = false,
  marginBottom = 0,
  marginTop = 0,
  maxSelected,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedValues, setTempSelectedValues] = useState<string[]>(selectedValues);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    setTempSelectedValues(selectedValues);
  }, [selectedValues]);

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

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

  const handleConfirm = useCallback(() => {
    onSelect(tempSelectedValues);
    setModalVisible(false);
  }, [tempSelectedValues, onSelect]);

  const handleClear = useCallback(() => {
    setTempSelectedValues([]);
  }, []);

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

  const isSelected = useCallback(
    (itemId: string) => {
      return tempSelectedValues.includes(itemId);
    },
    [tempSelectedValues],
  );

  const isMaxReached = useCallback(() => {
    if (!maxSelected) {
      return false;
    }
    return tempSelectedValues.length >= maxSelected;
  }, [tempSelectedValues, maxSelected]);

  return (
    <Block marginBottom={marginBottom} marginTop={marginTop}>
      {label && (
        <Typography.B14 marginBottom={ESpacings.s8} color={Colors.gray}>
          {label}
        </Typography.B14>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Block
          backgroundColor={disabled ? Colors.gray : Colors.black}
          borderRadius={8}
          paddingHorizontal={ESpacings.s12}
          paddingVertical={ESpacings.s14}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
          style={[styles.selectContainer, error && styles.errorBorder]}
        >
          <Typography.B14
            color={selectedValues.length > 0 ? Colors.white : Colors.gray}
            style={styles.selectText}
            numberOfLines={1}
          >
            {getSelectedLabels()}
          </Typography.B14>
          <Icon
            name={modalVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.white}
          />
        </Block>
      </TouchableOpacity>

      {error && (
        <Typography.B14 marginTop={ESpacings.s4} color={Colors.error}>
          {error}
        </Typography.B14>
      )}

      {/* Выбранные теги */}
      {selectedValues.length > 0 && !modalVisible && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {items
            .filter((item) => selectedValues.includes(item.id))
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelect(selectedValues.filter((id) => id !== item.id))}
                style={styles.tag}
              >
                <Typography.B14 color={Colors.white}>{item.name}</Typography.B14>
                <Icon name="x" size={14} color={Colors.white} style={styles.tagIcon} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Block backgroundColor={Colors.gray} borderRadius={12} overflow="hidden">
                  {/* Заголовок */}
                  <Block
                    padding={ESpacings.s16}
                    borderBottomWidth={1}
                    borderBottomColor={Colors.gray}
                  >
                    <Block
                      flexDirection={'row'}
                      justifyContent={'space-between'}
                      alignItems={'center'}
                      marginBottom={ESpacings.s12}
                    >
                      <Typography.B14 color={Colors.white}>
                        {label || 'Выберите значения'}
                      </Typography.B14>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Icon name="x" size={24} color={Colors.white} />
                      </TouchableOpacity>
                    </Block>

                    {maxSelected && (
                      <Typography.B14 color={Colors.gray}>
                        Выбрано: {tempSelectedValues.length} / {maxSelected}
                      </Typography.B14>
                    )}

                    {tempSelectedValues.length > 0 && (
                      <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <Typography.B14 color={Colors.error}>Очистить все</Typography.B14>
                      </TouchableOpacity>
                    )}
                  </Block>

                  {/* Список опций */}
                  <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleToggle(item.id)}
                        activeOpacity={0.7}
                        disabled={!isSelected(item.id) && isMaxReached()}
                      >
                        <Block
                          padding={ESpacings.s16}
                          borderBottomWidth={1}
                          borderBottomColor={Colors.gray}
                          flexDirection={'row'}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          opacity={!isSelected(item.id) && isMaxReached() ? 0.5 : 1}
                        >
                          <Typography.B14 color={Colors.white}>{item.name}</Typography.B14>
                          <View
                            style={[
                              styles.checkbox,
                              isSelected(item.id) && styles.checkboxSelected,
                            ]}
                          >
                            {isSelected(item.id) && (
                              <Icon name="check" size={14} color={Colors.white} />
                            )}
                          </View>
                        </Block>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />

                  {/* Кнопки действий */}
                  <Block
                    flexDirection={'row'}
                    padding={ESpacings.s16}
                    borderTopWidth={1}
                    borderTopColor={Colors.gray}
                    gap={ESpacings.s12}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setTempSelectedValues(selectedValues);
                        setModalVisible(false);
                      }}
                      style={[styles.button, styles.cancelButton]}
                    >
                      <Typography.B16 color={Colors.white} textAlign={'center'}>
                        Отмена
                      </Typography.B16>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleConfirm}
                      style={[styles.button, styles.confirmButton]}
                    >
                      <Typography.B16 color={Colors.white} textAlign={'center'}>
                        Готово ({tempSelectedValues.length})
                      </Typography.B16>
                    </TouchableOpacity>
                  </Block>
                </Block>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Block>
  );
};

const styles = StyleSheet.create({
  selectContainer: {
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  selectText: {
    flex: 1,
  },
  errorBorder: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    marginHorizontal: ESpacings.s16,
    marginBottom: ESpacings.s16,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: ESpacings.s8,
    maxHeight: 40,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: ESpacings.s12,
    paddingVertical: ESpacings.s6,
    marginRight: ESpacings.s8,
  },
  tagIcon: {
    marginLeft: ESpacings.s4,
  },
  clearButton: {
    marginTop: ESpacings.s8,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.transparent,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  button: {
    flex: 1,
    paddingVertical: ESpacings.s12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
});

export const MultiSelect = memo(MultiSelectComponent, isEqual);
