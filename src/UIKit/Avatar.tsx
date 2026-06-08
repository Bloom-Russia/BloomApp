import { Block, Colors, ESize, Icon, IconNames } from '@UIKit';
import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { Image } from 'react-native';
import styled from 'styled-components/native';

export interface AvatarProps {
  source?: string | null;
}

const AvatarComponent: React.FC<AvatarProps> = ({ source }) => {
  return (
    <AvatarContainer justifyContent={'center'} alignItems={'center'}>
      {source ? <StyledImage source={{ uri: source }} resizeMode="cover" /> : null}
      <AbsoluteContainer alignItems={'center'} justifyContent={'center'}>
        <Icon name={IconNames.user} color={Colors.white} size={ESize.s24} />
      </AbsoluteContainer>
    </AvatarContainer>
  );
};

export const Avatar = memo(AvatarComponent, isEqual);

const AvatarContainer = styled(Block)({
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 1,
  borderColor: Colors.white,
  borderStyle: 'dashed',
  overflow: 'hidden',
});

const AbsoluteContainer = styled(Block)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

const StyledImage = styled(Image)({
  width: 100,
  height: 100,
});
