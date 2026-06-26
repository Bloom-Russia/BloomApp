import { noop } from 'lodash';
import React from 'react';
import { Linking, Platform, TouchableOpacity } from 'react-native';
import { Colors, ESpacings, Typography } from './constants';
import { Block } from './helpers';

type Props = {
  value: string | null | undefined;
  label: string;
  marginBottom?: number;
  onPress?: (value: string, label: string) => void;
};

export const UserDataItem: React.FC<Props> = ({ label, value, marginBottom, onPress }) => {
  const getFieldType = (fieldLabel: string): string => {
    const lowerLabel = fieldLabel.toLowerCase();
    if (['телефон'].includes(lowerLabel)) {
      return 'phone';
    }
    if (['email', 'e-mail', 'почта'].includes(lowerLabel)) {
      return 'email';
    }
    if (['telegram', 'tg', 'телеграм'].includes(lowerLabel)) {
      return 'telegram';
    }
    if (['адрес', 'адрес студии', 'локация'].includes(lowerLabel)) {
      return 'address';
    }
    return 'text';
  };

  const isClickable = (): boolean => {
    if (!value) {
      return false;
    }

    if (onPress) {
      return true;
    }

    const fieldType = getFieldType(label);
    return ['phone', 'email', 'telegram', 'address'].includes(fieldType);
  };

  const handlePress = () => {
    if (!value) {
      return;
    }

    if (onPress) {
      onPress(value, label);
      return;
    }

    const trimmedValue = value.trim();
    const fieldType = getFieldType(label);

    switch (fieldType) {
      case 'phone':
        handlePhonePress(trimmedValue);
        break;
      case 'email':
        handleEmailPress(trimmedValue);
        break;
      case 'telegram':
        handleTelegramPress(trimmedValue);
        break;
      case 'address':
        handleAddressPress(trimmedValue);
        break;
      default:
        break;
    }
  };

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${cleanPhone}` : `tel:${cleanPhone}`;

    openUrl(url);
  };

  const handleEmailPress = (email: string) => {
    const url = `mailto:${email}`;
    openUrl(url);
  };

  const handleTelegramPress = (username: string) => {
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const tgAppUrl = `tg://resolve?domain=${cleanUsername}`;
    const tgWebUrl = `https://t.me/${cleanUsername}`;

    Linking.canOpenURL(tgAppUrl).then((supported) => {
      if (supported) {
        return Linking.openURL(tgAppUrl);
      } else {
        return Linking.openURL(tgWebUrl);
      }
    });
  };

  const handleAddressPress = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const yandexUrl = `yandexnavi://build_route?lat_to=&lon_to=&text=${encodedAddress}`;
    const yandexMapsUrl = `yandexmaps://maps.yandex.ru/?text=${encodedAddress}`;
    const webUrl = `https://yandex.ru/maps/?text=${encodedAddress}`;

    Linking.canOpenURL(yandexUrl).then((supported) => {
      if (supported) {
        Linking.openURL(yandexUrl).then(noop);
      } else {
        Linking.canOpenURL(yandexMapsUrl).then((mapsSupported) => {
          if (mapsSupported) {
            Linking.openURL(yandexMapsUrl).then(noop);
          } else {
            Linking.openURL(webUrl).then(noop);
          }
        });
      }
    });
  };

  const openUrl = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url).then(noop);
      }
    });
  };

  return (
    <>
      {value ? (
        <Block marginBottom={marginBottom}>
          <Typography.B16 marginBottom={ESpacings.s4} color={Colors.gray}>
            {label}
          </Typography.B16>
          {isClickable() ? (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
              <Typography.B16 color={Colors.primary}>{value}</Typography.B16>
            </TouchableOpacity>
          ) : (
            <Typography.B16 color={Colors.white}>{value}</Typography.B16>
          )}
        </Block>
      ) : null}
    </>
  );
};
