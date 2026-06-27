import { useErrorWithTimeout, useHandleExitApp, useLogOut } from '@hooks';
import { EScreens, ProfileStackParamList } from '@navigation';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UpdateUserData, UpdateUserRequest } from '@services';
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
import { getSelectedName, normalizePhoneNumber, parseDateFromString } from '@utils';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import {
  findNodeHandle,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

type Experience = {
  id: string;
  name: string;
};

const experiences: Experience[] = [
  {
    id: '1',
    name: 'Мееьше 1 года',
  },
  {
    id: '2',
    name: '1 - 3 года',
  },
  {
    id: '3',
    name: '3 - 5 лет',
  },
  {
    id: '4',
    name: 'Более 5 лет',
  },
];

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [max, setMax] = useState('');
  const [experience, setExperience] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [studioAddress, setStudioAddress] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCitySheetVisible, setIsCitySheetVisible] = useState(false);
  const [isExperienceSheetVisible, setIsExperienceSheetVisible] = useState(false);
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

  const handleExperienceSelect = useCallback((value: SelectItem) => {
    setExperience(value.name);
    setExperienceError(false);
    setIsExperienceSheetVisible(false);
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
    if (!experience.trim()) {
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

  const selectBottomSheetOnClose = useCallback(() => {
    setTimeout(() => {
      setIsCitySheetVisible(false);
      setIsExperienceSheetVisible(false);
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
      experience: experience,
      max: max ? normalizePhoneNumber(max) : undefined,
      city: selectedCity,
      professions: selectedProfessions,
      email: email || undefined,
      address: studioAddress,
      phoneNumber: normalizePhoneNumber(phone),
    };

    // Просто передаем avatar отдельно
    const params: UpdateUserRequest = {
      userData,
      avatar: avatar || undefined,
    };

    const { success, phoneIsChanged } = await updateUser({
      params,
      options: { changeLoading: setLoading, errorCodeCallBack: setErrorMessageWithTimeout },
    });

    if (success) {
      if (phoneIsChanged) {
        messagePhoneNumberIsChanged();
      } else {
        navigation.navigate(EScreens.PROFILE_SCREEN);
      }
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

  const formatDate = (date: Date | null): string => {
    if (!date) {
      return '';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const [inputValue, setInputValue] = useState(
    birthday || (birthDate ? formatDate(birthDate) : ''),
  );

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const normalizedDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setBirthDate(normalizedDate);
      setBirthDateError(false);
      const formatted = formatDate(normalizedDate);
      setInputValue(formatted);
      setBirthday(formatted);
    }
  };

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
              <Avatar isEditable source={avatar} />
            </TouchableOpacity>
          </Block>

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
            marginBottom={ESpacings.s12}
          />

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
            <Select
              placeholder="Выберите свой опыт"
              selectedValue={experience}
              onSelect={() => setIsExperienceSheetVisible(true)}
              marginBottom={ESpacings.s12}
              label="Опыт"
              errorText="Выберите свой опыт"
              isError={experienceError}
            />
          </View>

          <View ref={cityRef}>
            <Select
              placeholder="Выберите город"
              selectedValue={getSelectedName(selectedCity, cities)}
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
        visible={isExperienceSheetVisible}
        label="Выберите свой опыт"
        items={experiences}
        selectedItem={experiences.find((c: Experience) => c.id === experience) || null}
        onSelect={handleExperienceSelect}
        onClose={selectBottomSheetOnClose}
      />

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

      {showDatePicker ? (
        Platform.OS === 'ios' ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <View
                style={{
                  backgroundColor: Colors.white || '#FFFFFF',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingBottom: Platform.OS === 'ios' ? 0 : 20,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E5E5',
                  }}
                >
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Typography.B16 color={Colors.primary}>Отмена</Typography.B16>
                  </TouchableOpacity>
                  <Typography.B16>Дата рождения</Typography.B16>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Typography.B16 color={Colors.primary}>Готово</Typography.B16>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={
                    birthDate || parseDateFromString(birthday) || new Date(1990, 0, 1, 12, 0, 0)
                  }
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  themeVariant="light"
                  style={{ backgroundColor: Colors.white || '#FFFFFF' }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={birthDate || parseDateFromString(birthday) || new Date(1990, 0, 1, 12, 0, 0)}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            maximumDate={new Date()}
            themeVariant="light"
            style={{ backgroundColor: Colors.white || '#FFFFFF' }}
          />
        )
      ) : null}
    </ScreenContainer>
  );
};

export const EditProfileScreen = memo(EditProfileScreenComponent, isEqual);
