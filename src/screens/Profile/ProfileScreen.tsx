import { useCustomAlert } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Avatar,
  Block,
  Button,
  Colors,
  DateTimeInputPicker,
  ESpacings,
  Input,
  MaskedInput,
  MultiSelect,
  ScreenContainer,
  Select,
  SelectItem,
  Typography,
} from '@UIKit';
import React, { memo, useCallback, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Alert, ScrollView, TouchableOpacity } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import styled from 'styled-components/native';
import { SelectBottomSheet } from './components/SelectBottomSheet';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, EScreens.PROFILE_SCREEN>;

const CITIES_OF_RUSSIA: SelectItem[] = [
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

const BEAUTY_PROFESSIONS: SelectItem[] = [
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
  const [birthday, setBirthday] = useState<string>('');
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
  const [isCitySheetVisible, setIsCitySheetVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const { showAlert, AlertComponent } = useCustomAlert();

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) {
      return CITIES_OF_RUSSIA;
    }
    return CITIES_OF_RUSSIA.filter((city) =>
      city.name.toLowerCase().includes(citySearchQuery.toLowerCase()),
    );
  }, [citySearchQuery]);

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

  const handleCitySelect = useCallback((city: SelectItem) => {
    setSelectedCity(city.id);
    setIsCitySheetVisible(false);
    setCitySearchQuery('');
  }, []);

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

  const getSelectedCityName = useCallback(() => {
    if (!selectedCity) {
      return null;
    }
    const city = CITIES_OF_RUSSIA.find((c) => c.id === selectedCity);
    return city?.name || null;
  }, [selectedCity]);

  const selectBottomSheetOnClose = useCallback(() => {
    setTimeout(() => {
      setIsCitySheetVisible(false);
      setCitySearchQuery('');
    }, 300);
  }, []);

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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Успех', 'Данные успешно сохранены!');
    } catch (error) {
      console.error('Не удалось сохранить данные', error);
      Alert.alert('Ошибка', 'Не удалось сохранить данные');
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

  return (
    <ScreenContainer
      scrollEnabled={false}
      title={'Редактирование профиля'}
      paddingHorizontal={ESpacings.s16}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ESpacings.s24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Block padding={ESpacings.s16}>
          <Block alignItems={'center'} marginBottom={ESpacings.s24}>
            <TouchableOpacity onPress={handleSelectAvatar}>
              <Avatar source={avatar} />
            </TouchableOpacity>
          </Block>

          <Input
            placeholder={'Имя'}
            value={firstName}
            onChangeValue={setFirstName}
            title={'Имя'}
            errorText={'Введите имя'}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Фамилия'}
            value={lastName}
            onChangeValue={setLastName}
            title={'Фамилия'}
            errorText={'Введите фамилию'}
            marginBottom={ESpacings.s12}
          />

          <Input
            placeholder={'Отчество'}
            value={patronymic}
            onChangeValue={setPatronymic}
            title={'Отчество'}
            marginBottom={ESpacings.s24}
          />

          <DateTimeInputPicker
            date={birthDate}
            setDate={setBirthDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            title={'Дата рождения'}
            errorText={'Введите дату рождения'}
            marginBottom={ESpacings.s12}
            value={birthday}
            setValue={setBirthday}
            isError
          />

          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Контактная информация
          </Typography.B20>

          <MaskedInput
            title={'Телефон'}
            phone={phone}
            setPhone={setPhone}
            marginBottom={ESpacings.s12}
            errorText={'Введите Телефон'}
            isError
          />

          <Input
            placeholder={'Telegram (Имя пользователя)'}
            title={'Telegram'}
            value={telegram}
            onChangeValue={setTelegram}
            marginBottom={ESpacings.s12}
            errorText={'Введите Telegram'}
          />

          <MaskedInput
            title={'Max'}
            phone={max}
            setPhone={setMax}
            marginBottom={ESpacings.s12}
            errorText={'Введите Max'}
            isError
          />

          <Input
            placeholder={'Стаж (лет)'}
            title={'Стаж'}
            value={experience}
            onChangeValue={setExperience}
            keyboardType={'numeric'}
            marginBottom={ESpacings.s12}
            errorText={'Введите Стаж'}
          />

          <Select
            placeholder={'Выберите город'}
            selectedValue={getSelectedCityName()}
            onSelect={() => setIsCitySheetVisible(true)}
            marginBottom={ESpacings.s12}
            label="Город"
            errorText={'Выберите город'}
          />

          <MultiSelect
            placeholder={'Выберите профессии'}
            items={BEAUTY_PROFESSIONS}
            selectedValues={selectedProfessions}
            onSelect={setSelectedProfessions}
            label="Профессии"
            marginBottom={ESpacings.s12}
            errorText={'Выберите профессии'}
          />

          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Адрес студии
          </Typography.B20>

          <Input
            placeholder={'Адрес студии'}
            value={studioAddress}
            onChangeValue={setStudioAddress}
            multiline={true}
            textAlignVertical={'top'}
            numberOfLines={4}
            height={100}
            marginBottom={ESpacings.s24}
            errorText={'Введите адрес студии'}
          />

          <Button
            title={'Сохранить'}
            loading={isLoading}
            onPress={handleSubmit}
            disabled={isLoading}
            marginBottom={ESpacings.s24}
          />
        </Block>
      </ScrollView>

      <AlertContainer>
        <AlertComponent />
      </AlertContainer>

      <SelectBottomSheet
        visible={isCitySheetVisible}
        label="Выберите город"
        items={filteredCities}
        searchQuery={citySearchQuery}
        onSearchChange={setCitySearchQuery}
        selectedItem={CITIES_OF_RUSSIA.find((c) => c.id === selectedCity) || null}
        onSelect={handleCitySelect}
        onClose={selectBottomSheetOnClose}
        searchPlaceholder="Поиск города"
        showSearch={true}
      />
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
