import { useErrorWithTimeout, useHandleExitApp, useLogOut } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UpdateUserRequest } from '@services';
import { ICity, IProfession, useAppStore, useUserStore } from '@store';
import {
  Avatar,
  Block,
  Button,
  Colors,
  DateTimeInputPicker,
  ESpacings,
  IconNames,
  Input,
  MaskedInput,
  MultiSelect,
  MultiSelectBottomSheet,
  ScreenContainer,
  Select,
  SelectBottomSheet,
  SelectItem,
  Typography,
} from '@UIKit';
import { normalizePhoneNumber } from '@utils';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { findNodeHandle, ScrollView, TouchableOpacity, UIManager, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

type EditProfileScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  EScreens.EDIT_PROFILE_SCREEN
>;

const EditProfileScreenComponent: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const {
    updateUser,
    user: {
      name,
      email: userEmail,
      phoneNumber,
      lastName: userLastName,
      patronymic: userPatronymic,
      birthday: userBirthday,
      telegram: userTelegram,
      experience: userExperience,
      max: userMax,
      city: userCity,
      avatar: userAvatar,
      professions: userProfessions,
      address,
    },
  } = useUserStore();
  const [exiting, setExiting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { logOutHandler } = useLogOut(setLoading);
  const { setErrorMessageWithTimeout, cleanupErrors, AlertComponent, showAlert } =
    useErrorWithTimeout();
  const { handleExitApp } = useHandleExitApp(showAlert, setExiting);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupErrors();
    };
  }, [cleanupErrors]);

  const messagePhoneNumberIsChanged = useCallback(() => {
    showAlert({
      title: 'Номер телефона изменен',
      message: 'Авторизуйтесь с новым номером телефона.',
      type: 'info',
      theme: 'dark',
      showIcon: true,
      cancelable: false,
      onDismiss: async () => await logOutHandler(),
      buttons: [
        {
          text: 'Выход',
          style: 'default',
          showButtonIcon: true,
          buttonIconName: IconNames.signOut,
          onPress: async () => await logOutHandler(),
        },
      ],
    });
  }, [logOutHandler, showAlert]);

  useEffect(() => {
    setFirstName(name || '');
    setEmail(userEmail || '');
    setPhone(phoneNumber || '');
    setLastName(userLastName || '');
    setPatronymic(userPatronymic || '');
    setBirthday(userBirthday || '');
    setTelegram(userTelegram || '');
    setMax(userMax || '');
    setExperience(userExperience || '');
    setAvatar(userAvatar || '');
    setSelectedCity(userCity || '');
    setSelectedProfessions(userProfessions || []);
    setStudioAddress(address || '');
  }, [
    name,
    userEmail,
    phoneNumber,
    userLastName,
    userPatronymic,
    userBirthday,
    userTelegram,
    userMax,
    userExperience,
    userAvatar,
    userCity,
    userProfessions,
    address,
  ]);

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [patronymic, setPatronymic] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthday, setBirthday] = useState<string>('');
  const [phone, setPhone] = useState<string>(phoneNumber);
  const [email, setEmail] = useState<string>(userEmail || '');
  const [telegram, setTelegram] = useState<string>(userTelegram || '');
  const [max, setMax] = useState<string>(userMax || '');
  const [experience, setExperience] = useState<string>(userExperience || '');
  const [avatar, setAvatar] = useState<string | undefined>(userAvatar);
  const [selectedCity, setSelectedCity] = useState<string | null>(userCity || null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(userProfessions || []);
  const [studioAddress, setStudioAddress] = useState<string>(address || '');

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isCitySheetVisible, setIsCitySheetVisible] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isProfessionsSheetVisible, setIsProfessionsSheetVisible] = useState<boolean>(false);
  const [professionsSearchQuery, setProfessionsSearchQuery] = useState<string>('');
  const [shouldScrollToError, setShouldScrollToError] = useState<boolean>(false);

  // Состояния для ошибок
  const [firstNameError, setFirstNameError] = useState<boolean>(false);
  const [lastNameError, setLastNameError] = useState<boolean>(false);
  const [birthDateError, setBirthDateError] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<boolean>(false);
  const [experienceError, setExperienceError] = useState<boolean>(false);
  const [cityError, setCityError] = useState<boolean>(false);
  const [professionsError, setProfessionsError] = useState<boolean>(false);
  const [studioAddressError, setStudioAddressError] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const {
    app: { cities, professions },
  } = useAppStore();

  // Refs для полей
  const firstNameRef = useRef<View>(null);
  const lastNameRef = useRef<View>(null);
  const birthDateRef = useRef<View>(null);
  const phoneRef = useRef<View>(null);
  const experienceRef = useRef<View>(null);
  const cityRef = useRef<View>(null);
  const professionsRef = useRef<View>(null);
  const studioAddressRef = useRef<View>(null);

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) {
      return cities;
    }
    return cities.filter((city: ICity) =>
      city.name.toLowerCase().includes(citySearchQuery.toLowerCase()),
    );
  }, [cities, citySearchQuery]);

  const filteredProfessions = useMemo(() => {
    if (!professionsSearchQuery.trim()) {
      return professions;
    }
    return professions.filter((profession: IProfession) =>
      profession.name.toLowerCase().includes(professionsSearchQuery.toLowerCase()),
    );
  }, [professions, professionsSearchQuery]);

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
    setCityError(false);
    setIsCitySheetVisible(false);
    setCitySearchQuery('');
  }, []);

  const handleProfessionsConfirm = useCallback((values: string[]) => {
    setSelectedProfessions(values);
    setProfessionsError(false);
    setIsProfessionsSheetVisible(false);
    setProfessionsSearchQuery('');
  }, []);

  const handleProfessionsClose = useCallback(() => {
    setTimeout(() => {
      setIsProfessionsSheetVisible(false);
      setProfessionsSearchQuery('');
    }, 300);
  }, []);

  // Функция для скролла к элементу с ошибкой
  const scrollToElement = useCallback((elementRef: React.RefObject<View | null>) => {
    if (elementRef.current && scrollViewRef.current) {
      const elementHandle = findNodeHandle(elementRef.current);
      const scrollHandle = findNodeHandle(scrollViewRef.current);

      if (elementHandle && scrollHandle) {
        UIManager.measureLayout(
          elementHandle,
          scrollHandle,
          () => null,
          (_x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
        );
      }
    }
  }, []);

  const scrollToFirstError = useCallback(() => {
    if (firstNameError) {
      scrollToElement(firstNameRef);
    } else if (lastNameError) {
      scrollToElement(lastNameRef);
    } else if (birthDateError) {
      scrollToElement(birthDateRef);
    } else if (phoneError) {
      scrollToElement(phoneRef);
    } else if (experienceError) {
      scrollToElement(experienceRef);
    } else if (cityError) {
      scrollToElement(cityRef);
    } else if (professionsError) {
      scrollToElement(professionsRef);
    } else if (studioAddressError) {
      scrollToElement(studioAddressRef);
    }
  }, [
    firstNameError,
    lastNameError,
    birthDateError,
    phoneError,
    experienceError,
    cityError,
    professionsError,
    studioAddressError,
    scrollToElement,
  ]);

  const validateForm = useCallback(() => {
    let isValid = true;

    // Валидация имени
    if (!firstName.trim()) {
      setFirstNameError(true);
      isValid = false;
    } else {
      setFirstNameError(false);
    }

    // Валидация фамилии
    if (!lastName.trim()) {
      setLastNameError(true);
      isValid = false;
    } else {
      setLastNameError(false);
    }

    // Валидация даты рождения
    if (!birthday) {
      setBirthDateError(true);
      isValid = false;
    } else {
      setBirthDateError(false);
    }

    // Валидация телефона
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      setPhoneError(true);
      isValid = false;
    } else {
      setPhoneError(false);
    }

    // Валидация стажа
    if (!experience.trim() || isNaN(Number(experience)) || Number(experience) < 0) {
      setExperienceError(true);
      isValid = false;
    } else {
      setExperienceError(false);
    }

    // Валидация города
    if (!selectedCity) {
      setCityError(true);
      isValid = false;
    } else {
      setCityError(false);
    }

    // Валидация профессий
    if (selectedProfessions.length === 0) {
      setProfessionsError(true);
      isValid = false;
    } else {
      setProfessionsError(false);
    }

    // Валидация адреса студии
    if (!studioAddress.trim()) {
      setStudioAddressError(true);
      isValid = false;
    } else {
      setStudioAddressError(false);
    }

    return isValid;
  }, [
    firstName,
    lastName,
    birthday,
    phone,
    experience,
    selectedCity,
    selectedProfessions.length,
    studioAddress,
  ]);

  const getSelectedCityName = useCallback(() => {
    if (!selectedCity) {
      return null;
    }
    const city = cities.find((c: ICity) => c.id === selectedCity);
    return city?.name || null;
  }, [cities, selectedCity]);

  const selectBottomSheetOnClose = useCallback(() => {
    setTimeout(() => {
      setIsCitySheetVisible(false);
      setCitySearchQuery('');
    }, 300);
  }, []);

  useEffect(() => {
    if (shouldScrollToError) {
      scrollToFirstError();
      setShouldScrollToError(false);
    }
  }, [
    shouldScrollToError,
    scrollToFirstError,
    firstNameError,
    lastNameError,
    birthDateError,
    phoneError,
    experienceError,
    cityError,
    professionsError,
    studioAddressError,
  ]);

  const handleSubmit = useCallback(async () => {
    const isValid = validateForm();

    if (!isValid || !selectedCity || !birthday) {
      setShouldScrollToError(true);
      return;
    }

    const formData: UpdateUserRequest = {
      name: firstName,
      lastName: lastName,
      patronymic: patronymic,
      birthday: birthday,
      telegram: telegram,
      experience: experience,
      max: max,
      city: selectedCity,
      professions: selectedProfessions,
      email: email,
      address: studioAddress,
      phoneNumber: normalizePhoneNumber(phone),
      avatar: avatar,
    };

    const { success } = await updateUser({
      params: {
        userData: formData,
        messagePhoneNumberIsChanged,
      },
      options: {
        changeLoading: setLoading,
        errorCodeCallBack: setErrorMessageWithTimeout,
      },
    });

    if (success) {
      navigation.navigate(EScreens.PROFILE_SCREEN);
    }
  }, [
    validateForm,
    selectedCity,
    birthday,
    firstName,
    lastName,
    patronymic,
    telegram,
    experience,
    max,
    selectedProfessions,
    email,
    studioAddress,
    phone,
    avatar,
    updateUser,
    messagePhoneNumberIsChanged,
    setErrorMessageWithTimeout,
    navigation,
  ]);

  return (
    <ScreenContainer
      scrollEnabled={false}
      title={'Редактирование профиля'}
      paddingHorizontal={ESpacings.s16}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Block padding={ESpacings.s16}>
          <Block alignItems={'center'} marginBottom={ESpacings.s24}>
            <TouchableOpacity onPress={handleSelectAvatar}>
              <Avatar source={avatar} />
            </TouchableOpacity>
          </Block>

          <View ref={firstNameRef}>
            <Input
              placeholder={'Имя'}
              autoCapitalize="sentences"
              value={firstName}
              onChangeValue={(value) => {
                setFirstName(value);
                setFirstNameError(false);
              }}
              title={'Имя'}
              marginBottom={ESpacings.s12}
              errorText={'Введите имя'}
              isError={firstNameError}
              autoComplete={'name'}
            />
          </View>

          <Input
            placeholder={'Отчество'}
            autoCapitalize="sentences"
            value={patronymic}
            onChangeValue={setPatronymic}
            title={'Отчество'}
            marginBottom={ESpacings.s24}
          />

          <View ref={lastNameRef}>
            <Input
              placeholder={'Фамилия'}
              autoCapitalize="sentences"
              value={lastName}
              onChangeValue={(value) => {
                setLastName(value);
                setLastNameError(false);
              }}
              title={'Фамилия'}
              marginBottom={ESpacings.s12}
              errorText={'Введите фамилию'}
              isError={lastNameError}
              autoComplete={'family-name'}
            />
          </View>

          <View ref={birthDateRef}>
            <DateTimeInputPicker
              date={birthDate}
              setDate={(date) => {
                setBirthDate(date);
                setBirthDateError(false);
              }}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              title={'Дата рождения'}
              errorText={'Введите дату рождения'}
              marginBottom={ESpacings.s12}
              value={birthday}
              setValue={setBirthday}
              isError={birthDateError}
            />
          </View>

          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Контактная информация
          </Typography.B20>

          <View ref={phoneRef}>
            <MaskedInput
              title={'Телефон'}
              phone={phone}
              setPhone={(value) => {
                setPhone(value);
                setPhoneError(false);
              }}
              marginBottom={ESpacings.s12}
              errorText={'Введите корректный номер телефона'}
              isError={phoneError}
              autoComplete={'tel'}
            />
          </View>

          <Input
            placeholder={'example@mail.com'}
            title={'email'}
            value={email}
            onChangeValue={setEmail}
            marginBottom={ESpacings.s12}
            autoComplete={'email'}
          />

          <Input
            placeholder={'Telegram (Имя пользователя)'}
            title={'Telegram'}
            value={telegram}
            onChangeValue={setTelegram}
            marginBottom={ESpacings.s12}
          />

          <MaskedInput title={'Max'} phone={max} setPhone={setMax} marginBottom={ESpacings.s12} />

          <View ref={experienceRef}>
            <Input
              placeholder={'Стаж (лет)'}
              title={'Стаж'}
              value={experience}
              onChangeValue={(text) => {
                setExperience(text);
                setExperienceError(false);
              }}
              keyboardType={'numeric'}
              marginBottom={ESpacings.s12}
              errorText={'Введите корректный стаж'}
              isError={experienceError}
            />
          </View>

          <View ref={cityRef}>
            <Select
              placeholder={'Выберите город'}
              selectedValue={getSelectedCityName()}
              onSelect={() => setIsCitySheetVisible(true)}
              marginBottom={ESpacings.s12}
              label="Город"
              errorText={'Выберите город'}
              isError={cityError}
            />
          </View>

          <View ref={professionsRef}>
            <MultiSelect
              placeholder={'Выберите профессии'}
              items={professions}
              selectedValues={selectedProfessions}
              onPress={() => setIsProfessionsSheetVisible(true)}
              onSelect={(values) => {
                setSelectedProfessions(values);
                setProfessionsError(false);
              }}
              label="Профессии"
              marginBottom={ESpacings.s12}
              errorText={'Выберите хотя бы одну профессию'}
              isError={professionsError}
            />
          </View>

          <Typography.B20
            marginTop={ESpacings.s8}
            marginBottom={ESpacings.s16}
            color={Colors.white}
          >
            Адрес студии
          </Typography.B20>

          <View ref={studioAddressRef}>
            <Input
              placeholder={'Адрес студии'}
              value={studioAddress}
              onChangeValue={(text) => {
                setStudioAddress(text);
                setStudioAddressError(false);
              }}
              multiline={true}
              textAlignVertical={'top'}
              numberOfLines={4}
              height={100}
              marginBottom={ESpacings.s24}
              errorText={'Введите адрес студии'}
              isError={studioAddressError}
            />
          </View>

          <Button
            title={'Сохранить'}
            loading={loading}
            onPress={handleSubmit}
            disabled={loading || exiting}
            marginBottom={ESpacings.s24}
          />

          <Button
            title={'Выйти из приложения'}
            loading={exiting}
            onPress={handleExitApp}
            paddingHorizontal={ESpacings.s16}
            disabled={loading || exiting}
          />
        </Block>
      </ScrollView>

      <AlertComponent />

      <SelectBottomSheet
        visible={isCitySheetVisible}
        label="Выберите город"
        items={filteredCities}
        searchQuery={citySearchQuery}
        onSearchChange={setCitySearchQuery}
        selectedItem={cities.find((c: ICity) => c.id === selectedCity) || null}
        onSelect={handleCitySelect}
        onClose={selectBottomSheetOnClose}
        searchPlaceholder="Поиск города"
        showSearch={true}
      />

      <MultiSelectBottomSheet
        visible={isProfessionsSheetVisible}
        label="Выберите профессии"
        items={filteredProfessions}
        searchQuery={professionsSearchQuery}
        onSearchChange={setProfessionsSearchQuery}
        selectedValues={selectedProfessions}
        onConfirm={handleProfessionsConfirm}
        onClose={handleProfessionsClose}
        searchPlaceholder="Поиск..."
        showSearch={true}
        maxSelected={undefined}
      />
    </ScreenContainer>
  );
};

export const EditProfileScreen = memo(EditProfileScreenComponent, isEqual);
