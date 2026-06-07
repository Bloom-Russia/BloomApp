import { AuthStackParamList, EScreens } from '@navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiClientService, SecureStorageKeys, SecureStorageService } from '@services';
import {
  Block,
  Button,
  Colors,
  ERounding,
  ESize,
  ESpacings,
  Row,
  Typography,
  WINDOW_WIDTH,
} from '@UIKit';
import { noop } from 'lodash';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { ActivityIndicator, FlatList, Image } from 'react-native';
import styled from 'styled-components/native';

interface OnboardingItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
}

type OnBoardingScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  EScreens.ON_BOARDING_SCREEN
>;

const contentContainerStyle = {
  flexGrow: 1,
};

const ListEmptyComponent: React.FC = () => (
  <Block flex={1} backgroundColor={Colors.black} justifyContent={'center'} alignItems={'center'}>
    <Typography.B16 color={Colors.white}>Нет данных для отображения</Typography.B16>
  </Block>
);

const keyExtractor = (item: OnboardingItem) => item.id.toString();

const OnBoardingScreenComponent: React.FC<OnBoardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const loadOnboardingSlides = useCallback(async () => {
    try {
      setLoading(true);

      const response = await ApiClientService.getOnboardingSlides();

      if (response?.success && response.data?.slides) {
        setOnboardingData(response.data.slides);
      }
    } catch (err) {
      console.error('Ошибка загрузки онбординга:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка слайдов онбординга
  useEffect(() => {
    loadOnboardingSlides().then(() => noop);
  }, [loadOnboardingSlides]);

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      // Отмечаем онбординг как завершенный
      await completeOnboarding();
      // Переход на следующий экран после завершения онбординга
      navigation.replace(EScreens.TABS_STACK as any);
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStorageService.saveValue(SecureStorageKeys.ONBOARDING_COMPLETED, true);
    } catch (_error) {
      console.error('Ошибка при завершении онбординга:', _error);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.replace(EScreens.TABS_STACK as any);
  };

  const renderItem = useCallback(({ item }: { item: OnboardingItem }) => {
    return (
      <Block flex={1}>
        <Block flex={1}>
          <StyledImage source={{ uri: item.imageUrl }} resizeMode="cover" />
        </Block>
        <Block paddingVertical={ESpacings.s16} alignItems={'center'} justifyContent={'center'}>
          <Typography.B16 color={Colors.white} marginBottom={ESpacings.s12}>
            {item.title}
          </Typography.B16>
          <Description>
            <Typography.R14 textAlign={'center'} color={Colors.textSecondary}>
              {item.description}
            </Typography.R14>
          </Description>
        </Block>
      </Block>
    );
  }, []);

  const Pagination = useCallback(() => {
    return (
      <Row>
        {onboardingData.map((_, index) => (
          <PaginationDot key={index} active={currentIndex === index} />
        ))}
      </Row>
    );
  }, [currentIndex, onboardingData]);

  const onScroll = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / WINDOW_WIDTH);
    setCurrentIndex(index);
  }, []);

  if (loading) {
    return (
      <Block
        flex={1}
        backgroundColor={Colors.black}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </Block>
    );
  }

  return (
    <Block flex={1} backgroundColor={Colors.black}>
      <SkipContainer>
        <Button
          onPress={handleSkip}
          title="Пропустить"
          color={Colors.primary}
          paddingHorizontal={ESpacings.s16}
        />
      </SkipContainer>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={ListEmptyComponent}
        getItemLayout={(_data, index) => ({
          length: WINDOW_WIDTH,
          offset: WINDOW_WIDTH * index,
          index,
        })}
      />

      <Block paddingHorizontal={ESpacings.s32} paddingVertical={ESpacings.s32}>
        <Row justifyContent={'space-between'} alignItems={'center'}>
          <Pagination />
          <Button
            paddingHorizontal={ESpacings.s16}
            onPress={handleNext}
            title={currentIndex === onboardingData.length - 1 ? 'Начать' : 'Далее'}
            color={Colors.primary}
          />
        </Row>
      </Block>
    </Block>
  );
};

export const OnBoardingScreen = memo(OnBoardingScreenComponent, isEqual);

const StyledImage = styled(Image)({
  flex: 1,
  width: '100%',
  height: '100%',
});

const SkipContainer = styled(Block)({
  position: 'absolute',
  top: 50,
  right: 20,
  zIndex: 10,
});

const Description = styled(Block)({
  width: WINDOW_WIDTH,
});

export const PaginationDot = styled(Block)<{ active: boolean }>(({ active }) => ({
  width: active ? ESize.s24 : ESize.s8,
  height: ESize.s8,
  borderRadius: ERounding.r4,
  backgroundColor: active ? Colors.primary : Colors.textSecondary,
  marginHorizontal: ESpacings.s4,
}));
