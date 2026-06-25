import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { IconProps } from 'react-native-vector-icons/Icon';

import config from './selection.json';

export enum IconNames {
  faceId = 'faceid',
  fingerprint = 'fingerprint',
  signOut = 'signout',
  cancel = 'cancel',
  reload = 'reload',
  warning = 'warning',
  info = 'info',
  error = 'error',
  success = 'success',
  help = 'help',
  backspace = 'backspace',
  user = 'user',
  calendar = 'calendar',
  search = 'search',
  chevronDown = 'chevron-down',
  checked = 'checked',
  edit = 'edit',
}

export const IconSet = createIconSetFromIcoMoon(config);

export const Icon: React.FC<IconProps> = ({ size = 24, ...rest }) => {
  return <IconSet size={size} {...rest} style={{ lineHeight: size }} />;
};
