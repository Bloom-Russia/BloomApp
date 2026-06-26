import { useErrorWithTimeout, useHandleExitApp, useLogOut } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UpdateUserData } from '@services';
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
      avatarUrl,
      professions: userProfessions,
      address,
    },
  } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { logOutHandler } = useLogOut(setLoading);
  const { setErrorMessageWithTimeout, cleanupErrors, AlertComponent, showAlert } =
    useErrorWithTimeout();
  const { handleExitApp } = useHandleExitApp(showAlert, setExiting);

  useEffect(() => cleanupErrors, [cleanupErrors]);

  const messagePhoneNumberIsChanged = useCallback(() => {
    showAlert({
      title: 'Номер телефона изменен',
      message: 'Авторизуйтесь с новым номером телефона.',
      type: 'info',
      theme: 'dark',
      showIcon: true,
      cancelable: false,
      onDismiss: logOutHandler,
      buttons: [
        {
          text: 'Выход',
          style: 'default',
          showButtonIcon: true,
          buttonIconName: IconNames.signOut,
          onPress: logOutHandler,
        },
      ],
    });
  }, [logOutHandler, showAlert]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState(phoneNumber);
  const [email, setEmail] = useState(userEmail || '');
  const [telegram, setTelegram] = useState(userTelegram || '');
  const [max, setMax] = useState(userMax || '');
  const [experience, setExperience] = useState(userExperience || '');
  const [avatar, setAvatar] = useState<string | undefined>(avatarUrl);
  const [selectedCity, setSelectedCity] = useState<string | null>(userCity || null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(userProfessions || []);
  const [studioAddress, setStudioAddress] = useState(address || '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCitySheetVisible, setIsCitySheetVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isProfessionsSheetVisible, setIsProfessionsSheetVisible] = useState(false);
  const [professionsSearchQuery, setProfessionsSearchQuery] = useState('');
  const [shouldScrollToError, setShouldScrollToError] = useState(false);

  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [birthDateError, setBirthDateError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [experienceError, setExperienceError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [professionsError, setProfessionsError] = useState(false);
  const [studioAddressError, setStudioAddressError] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { cities, professions } = useAppStore().app;

  const firstNameRef = useRef<View>(null);
  const lastNameRef = useRef<View>(null);
  const birthDateRef = useRef<View>(null);
  const phoneRef = useRef<View>(null);
  const experienceRef = useRef<View>(null);
  const cityRef = useRef<View>(null);
  const professionsRef = useRef<View>(null);
  const studioAddressRef = useRef<View>(null);

  useEffect(() => {
    setFirstName(name || '');
    setEmail(userEmail || '');
    setPhone(phoneNumber);
    setLastName(userLastName || '');
    setPatronymic(userPatronymic || '');
    setBirthday(userBirthday || '');
    setTelegram(userTelegram || '');
    setMax(userMax || '');
    setExperience(userExperience || '');
    setAvatar(avatarUrl || '');
    setSelectedCity(userCity || null);
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
    avatarUrl,
    userCity,
    userProfessions,
    address,
  ]);

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
      .then((image) => setAvatar(image.path))
      .catch(console.log);
  }, []);

  const openGallery = useCallback(() => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
    })
      .then((image) => setAvatar(image.path))
      .catch(console.log);
  }, []);

  const handleSelectAvatar = useCallback(() => {
    showAlert({
      title: 'Выберите аватар',
      message: 'Хотите выбрать фото из галереи или сделать снимок?',
      type: 'info',
      theme: 'dark',
      showIcon: true,
      buttons: [
        { text: 'Галерея', style: 'default', onPress: openGallery },
        { text: 'Камера', style: 'default', onPress: openCamera },
        { text: 'Отмена', style: 'destructive' },
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
    const errors = [
      { field: firstNameError, ref: firstNameRef },
      { field: lastNameError, ref: lastNameRef },
      { field: birthDateError, ref: birthDateRef },
      { field: phoneError, ref: phoneRef },
      { field: experienceError, ref: experienceRef },
      { field: cityError, ref: cityRef },
      { field: professionsError, ref: professionsRef },
      { field: studioAddressError, ref: studioAddressRef },
    ];
    const firstError = errors.find((e) => e.field);
    if (firstError) {
      scrollToElement(firstError.ref);
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

  useEffect(() => {
    if (shouldScrollToError) {
      scrollToFirstError();
      setShouldScrollToError(false);
    }
  }, [shouldScrollToError, scrollToFirstError]);

  const validateForm = useCallback(() => {
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError(true);
      isValid = false;
    } else {
      setFirstNameError(false);
    }
    if (!lastName.trim()) {
      setLastNameError(true);
      isValid = false;
    } else {
      setLastNameError(false);
    }
    if (!birthday) {
      setBirthDateError(true);
      isValid = false;
    } else {
      setBirthDateError(false);
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setPhoneError(true);
      isValid = false;
    } else {
      setPhoneError(false);
    }
    if (!experience.trim() || isNaN(Number(experience)) || Number(experience) < 0) {
      setExperienceError(true);
      isValid = false;
    } else {
      setExperienceError(false);
    }
    if (!selectedCity) {
      setCityError(true);
      isValid = false;
    } else {
      setCityError(false);
    }
    if (selectedProfessions.length === 0) {
      setProfessionsError(true);
      isValid = false;
    } else {
      setProfessionsError(false);
    }
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
    return cities.find((c: ICity) => c.id === selectedCity)?.name || null;
  }, [cities, selectedCity]);

  const selectBottomSheetOnClose = useCallback(() => {
    setTimeout(() => {
      setIsCitySheetVisible(false);
      setCitySearchQuery('');
    }, 300);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedCity || !birthday) {
      setShouldScrollToError(true);
      return;
    }

    const userData: UpdateUserData = {
      name: firstName,
      lastName,
      patronymic: patronymic || undefined,
      birthday,
      telegram: telegram || undefined,
      experience,
      max: max || undefined,
      city: selectedCity,
      professions: selectedProfessions,
      email: email || undefined,
      address: studioAddress,
      phoneNumber: normalizePhoneNumber(phone),
    };

    if (avatar) {
      userData.avatar = avatar;
    }

    const { success } = await updateUser({
      params: { userData, messagePhoneNumberIsChanged },
      options: { changeLoading: setLoading, errorCodeCallBack: setErrorMessageWithTimeout },
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
      title="Редактирование профиля"
      paddingHorizontal={ESpacings.s16}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Block padding={ESpacings.s16}>
          <Block alignItems="center" marginBottom={ESpacings.s24}>
            <TouchableOpacity onPress={handleSelectAvatar}>
              <Avatar source={avatar} />
            </TouchableOpacity>
          </Block>

          <View ref={firstNameRef}>
            <Input
              placeholder="Имя"
              autoCapitalize="sentences"
              value={firstName}
              onChangeValue={(v) => {
                setFirstName(v);
                setFirstNameError(false);
              }}
              title="Имя"
              marginBottom={ESpacings.s12}
              errorText="Введите имя"
              isError={firstNameError}
              autoComplete="name"
            />
          </View>

          <Input
            placeholder="Отчество"
            autoCapitalize="sentences"
            value={patronymic}
            onChangeValue={setPatronymic}
            title="Отчество"
            marginBottom={ESpacings.s24}
          />

          <View ref={lastNameRef}>
            <Input
              placeholder="Фамилия"
              autoCapitalize="sentences"
              value={lastName}
              onChangeValue={(v) => {
                setLastName(v);
                setLastNameError(false);
              }}
              title="Фамилия"
              marginBottom={ESpacings.s12}
              errorText="Введите фамилию"
              isError={lastNameError}
              autoComplete="family-name"
            />
          </View>

          <View ref={birthDateRef}>
            <DateTimeInputPicker
              date={birthDate}
              setDate={(d) => {
                setBirthDate(d);
                setBirthDateError(false);
              }}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              title="Дата рождения"
              errorText="Введите дату рождения"
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
              title="Телефон"
              phone={phone}
              setPhone={(v) => {
                setPhone(v);
                setPhoneError(false);
              }}
              marginBottom={ESpacings.s12}
              errorText="Введите корректный номер телефона"
              isError={phoneError}
              autoComplete="tel"
            />
          </View>

          <Input
            placeholder="example@mail.com"
            title="Email"
            value={email}
            onChangeValue={setEmail}
            marginBottom={ESpacings.s12}
            autoComplete="email"
          />

          <Input
            placeholder="Telegram (Имя пользователя)"
            title="Telegram"
            value={telegram}
            onChangeValue={setTelegram}
            marginBottom={ESpacings.s12}
          />

          <MaskedInput title="Max" phone={max} setPhone={setMax} marginBottom={ESpacings.s12} />

          <View ref={experienceRef}>
            <Input
              placeholder="Стаж (лет)"
              title="Стаж"
              value={experience}
              onChangeValue={(v) => {
                setExperience(v);
                setExperienceError(false);
              }}
              keyboardType="numeric"
              marginBottom={ESpacings.s12}
              errorText="Введите корректный стаж"
              isError={experienceError}
            />
          </View>

          <View ref={cityRef}>
            <Select
              placeholder="Выберите город"
              selectedValue={getSelectedCityName()}
              onSelect={() => setIsCitySheetVisible(true)}
              marginBottom={ESpacings.s12}
              label="Город"
              errorText="Выберите город"
              isError={cityError}
            />
          </View>

          <View ref={professionsRef}>
            <MultiSelect
              placeholder="Выберите профессии"
              items={professions}
              selectedValues={selectedProfessions}
              onPress={() => setIsProfessionsSheetVisible(true)}
              onSelect={(v) => {
                setSelectedProfessions(v);
                setProfessionsError(false);
              }}
              label="Профессии"
              marginBottom={ESpacings.s12}
              errorText="Выберите хотя бы одну профессию"
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
              placeholder="Адрес студии"
              value={studioAddress}
              onChangeValue={(v) => {
                setStudioAddress(v);
                setStudioAddressError(false);
              }}
              multiline
              textAlignVertical="top"
              numberOfLines={4}
              height={100}
              marginBottom={ESpacings.s24}
              errorText="Введите адрес студии"
              isError={studioAddressError}
            />
          </View>

          <Button
            title="Сохранить"
            loading={loading}
            onPress={handleSubmit}
            disabled={loading || exiting}
            marginBottom={ESpacings.s24}
          />

          <Button
            title="Выйти из приложения"
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
        showSearch
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
        showSearch
        maxSelected={undefined}
      />
    </ScreenContainer>
  );
};

export const EditProfileScreen = memo(EditProfileScreenComponent, isEqual);
