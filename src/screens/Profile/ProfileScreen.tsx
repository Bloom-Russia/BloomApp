import { useCustomAlert } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Avatar,
  Block,
  Button,
  Colors,
  ESpacings,
  Input,
  MultiSelect,
  ScreenContainer,
  Select,
  Typography,
} from '@UIKit';
import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Alert, Platform, ScrollView, TouchableOpacity } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import styled from 'styled-components/native';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

// Данные для выпадающих списков
const CITIES_OF_RUSSIA = [
  { id: '1', name: 'Москва' },
  { id: '2', name: 'Санкт-Петербург' },
  { id: '3', name: 'Новосибирск' },
  { id: '4', name: 'Екатеринбург' },
  { id: '5', name: 'Казань' },
  { id: '6', name: 'Нижний Новгород' },
  { id: '7', name: 'Челябинск' },
  { id: '8', name: 'Самара' },
  { id: '9', name: 'Омск' },
  { id: '10', name: 'Ростов-на-Дону' },
  { id: '11', name: 'Уфа' },
  { id: '12', name: 'Красноярск' },
  { id: '13', name: 'Пермь' },
  { id: '14', name: 'Воронеж' },
  { id: '15', name: 'Волгоград' },
];

const BEAUTY_PROFESSIONS = [
  { id: '1', name: 'Парикмахер' },
  { id: '2', name: 'Косметолог' },
  { id: '3', name: 'Визажист' },
  { id: '4', name: 'Маникюрщик' },
  { id: '5', name: 'Педикюрщик' },
  { id: '6', name: 'Бровист' },
  { id: '7', name: 'Лэшмейкер' },
  { id: '8', name: 'Массажист' },
  { id: '9', name: 'Стилист' },
  { id: '10', name: 'Шугаринг-мастер' },
  { id: '11', name: 'Перманентный макияж' },
  { id: '12', name: 'Трихолог' },
];

const ProfileScreenComponent: React.FC<ProfileScreenProps> = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [max, setMax] = useState('');
  const [experience, setExperience] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [studioAddress, setStudioAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  const openCamera = useCallback(() => {
    ImagePicker.openCamera({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
    })
      .then((image) => {
        setAvatar(image.path);
      })
      .catch((error) => {
        console.log('Camera error:', error);
      });
  }, []);

  const openGallery = useCallback(() => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
    })
      .then((image) => {
        setAvatar(image.path);
      })
      .catch((error) => {
        console.log('Gallery error:', error);
      });
  }, []);

  // Функция для выбора аватарки
  const handleSelectAvatar = useCallback(() => {
    showAlert({
      title: 'Выберите аватар',
      message: 'Хотите выбрать фото из галереи или сделать снимок?',
      type: 'info',
      theme: 'dark',
      showIcon: true,
      buttons: [
        {
          text: 'Галерея',
          style: 'default',
          onPress: openGallery,
        },
        {
          text: 'Камера',
          style: 'default',
          onPress: openCamera,
        },
        {
          text: 'Отмена',
          style: 'destructive',
        },
      ],
    });
  }, [openCamera, openGallery, showAlert]);

  // Обработка изменения даты
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Валидация формы
  const validateForm = useCallback(() => {
    if (!firstName.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите имя');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите фамилию');
      return false;
    }
    if (!birthDate) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите дату рождения');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите номер телефона');
      return false;
    }
    if (!selectedCity) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите город');
      return false;
    }
    if (selectedProfessions.length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы одну профессию');
      return false;
    }
    return true;
  }, [firstName, lastName, birthDate, phone, selectedCity, selectedProfessions]);

  // Отправка формы
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Имитация отправки данных на сервер
    try {
      const formData = {
        firstName,
        lastName,
        patronymic,
        birthDate: birthDate?.toISOString(),
        phone,
        telegram,
        max,
        experience,
        avatar,
        city: selectedCity,
        professions: selectedProfessions,
        studioAddress,
      };

      console.log('Form data:', formData);

      // Здесь должен быть реальный API запрос
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Успех', 'Данные успешно сохранены!');
      // navigation.navigate(EScreens.MAIN_SCREEN);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить данные', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    firstName,
    lastName,
    patronymic,
    birthDate,
    phone,
    telegram,
    max,
    experience,
    avatar,
    selectedCity,
    selectedProfessions,
    studioAddress,
    validateForm,
  ]);

  // Форматирование даты для отображения
  const formatDate = (date: Date | null) => {
    if (!date) {
      return 'Выберите дату';
    }
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <ScreenContainer title={'Редактирование профиля '} paddingHorizontal={ESpacings.s16}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ESpacings.s24 }}
      >
        <Block padding={ESpacings.s16}>
          <Block alignItems={'center'} marginBottom={ESpacings.s24}>
            <TouchableOpacity onPress={handleSelectAvatar}>
              <Avatar source={avatar} />
            </TouchableOpacity>
          </Block>

          {/* Персональная информация */}
          <Typography.B20 marginBottom={ESpacings.s16} color={Colors.white}>
            Персональные данные
          </Typography.B20>

          <Input
            placeholder={'Имя *'}
            value={firstName}
            onChangeText={setFirstName}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Фамилия *'}
            value={lastName}
            onChangeText={setLastName}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Отчество'}
            value={patronymic}
            onChangeText={setPatronymic}
            marginBottom={ESpacings.s12}
          />

          {/* Дата рождения */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Block
              backgroundColor={Colors.gray}
              padding={ESpacings.s12}
              borderRadius={8}
              marginBottom={ESpacings.s12}
            >
              <Typography.B14 color={Colors.white}>{formatDate(birthDate)}</Typography.B14>
            </Block>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date(1990, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Контактная информация */}
          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Контактная информация
          </Typography.B20>

          <Input
            placeholder={'Телефон *'}
            value={phone}
            onChangeText={setPhone}
            keyboardType={'phone-pad'}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Telegram (username)'}
            value={telegram}
            onChangeText={setTelegram}
            marginBottom={ESpacings.s12}
          />

          {/* Профессиональная информация */}
          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Профессиональные данные
          </Typography.B20>

          <Input
            placeholder={'MAX (максимальная загрузка)'}
            value={max}
            onChangeText={setMax}
            keyboardType={'numeric'}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Стаж (лет) *'}
            value={experience}
            onChangeText={setExperience}
            keyboardType={'numeric'}
            marginBottom={ESpacings.s12}
          />

          {/* Выбор города */}
          <Select
            placeholder={'Выберите город *'}
            items={CITIES_OF_RUSSIA}
            selectedValue={selectedCity}
            onSelect={setSelectedCity}
            marginBottom={ESpacings.s12}
            label="Город"
          />

          {/* Множественный выбор профессий */}
          <MultiSelect
            placeholder={'Выберите профессии *'}
            items={BEAUTY_PROFESSIONS}
            selectedValues={selectedProfessions}
            onSelect={setSelectedProfessions}
            label="Профессии"
            marginBottom={ESpacings.s12}
          />

          {/* Адрес студии */}
          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Информация о студии
          </Typography.B20>

          <Input
            placeholder={'Адрес студии'}
            value={studioAddress}
            onChangeText={setStudioAddress}
            multiline
            numberOfLines={3}
            textAlignVertical={'top'}
            marginBottom={ESpacings.s24}
          />

          {/* Кнопка отправки */}
          <Button
            title={isLoading ? 'Сохранение...' : 'Завершить регистрацию'}
            onPress={handleSubmit}
            disabled={isLoading}
            marginBottom={ESpacings.s24}
          />
        </Block>
      </ScrollView>
      <AlertContainer>
        <AlertComponent />
      </AlertContainer>
    </ScreenContainer>
  );
};

export const ProfileScreen = memo(ProfileScreenComponent, isEqual);

const AlertContainer = styled(Block)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 500,
});
