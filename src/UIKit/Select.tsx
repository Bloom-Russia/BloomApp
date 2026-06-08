import { Block, Colors, ESpacings, Icon, Typography } from '@UIKit';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  error?: string;
  disabled?: boolean;
  marginBottom?: number;
  marginTop?: number;
}

const SelectComponent: React.FC<SelectProps> = ({
  placeholder = 'Выберите значение',
  items,
  selectedValue,
  onSelect,
  label,
  error,
  disabled = false,
  marginBottom = 0,
  marginTop = 0,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectItem | null>(
    selectedValue ? items.find((item) => item.id === selectedValue) || null : null,
  );
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  const handleSelect = useCallback(
    (item: SelectItem) => {
      setSelectedItem(item);
      onSelect(item.id);
      setModalVisible(false);
    },
    [onSelect],
  );

  const getSelectedLabel = useCallback(() => {
    if (selectedItem) {
      return selectedItem.name;
    }
    return placeholder;
  }, [selectedItem, placeholder]);

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
            color={selectedItem ? Colors.white : Colors.gray}
            style={styles.selectText}
          >
            {getSelectedLabel()}
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
                    flexDirection={'row'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                  >
                    <Typography.B14 color={Colors.white}>
                      {label || 'Выберите значение'}
                    </Typography.B14>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Icon name="x" size={24} color={Colors.white} />
                    </TouchableOpacity>
                  </Block>

                  {/* Список опций */}
                  <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
                        <Block
                          padding={ESpacings.s16}
                          borderBottomWidth={1}
                          borderBottomColor={Colors.gray}
                          flexDirection={'row'}
                          justifyContent={'space-between'}
                          alignItems={'center'}
                          backgroundColor={
                            selectedItem?.id === item.id ? Colors.gray : Colors.transparent
                          }
                        >
                          <Typography.B14 color={Colors.white}>{item.name}</Typography.B14>
                          {selectedItem?.id === item.id && (
                            <Icon name="check" size={20} color={Colors.primary} />
                          )}
                        </Block>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
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
    maxHeight: SCREEN_HEIGHT * 0.7,
    marginHorizontal: ESpacings.s16,
    marginBottom: ESpacings.s16,
  },
});

export const Select = memo(SelectComponent, isEqual);
