/**
 * Стандартные отступы
 * Используются во всех UI-компонентах
 */
export enum ESpacings {
  s0 = 0,
  s2 = 2,
  s4 = 4,
  s6 = 6,
  s8 = 8,
  s10 = 10,
  s12 = 12,
  s14 = 14,
  s16 = 16,
  s18 = 18,
  s20 = 20,
  s22 = 22,
  s24 = 24,
  s26 = 26,
  s28 = 28,
  s32 = 32,
  s36 = 36,
  s38 = 38,
  s48 = 48,
  s56 = 56,
  s64 = 64,
}

/**
 * Стандартные скругления
 */
export enum ERounding {
  r2 = 2,
  r4 = 4,
  r6 = 6,
  r8 = 8,
  r10 = 10,
  r12 = 12,
  r14 = 14,
  r16 = 16,
  r20 = 20,
  r24 = 24,
  r32 = 32,
  r48 = 48,
  r100 = 100,
}

/**
 * Стандартные размеры
 */
export enum ESize {
  s4 = 4,
  s8 = 8,
  s12 = 12,
  s16 = 16,
  s18 = 18,
  s20 = 20,
  s22 = 22,
  s24 = 24,
  s26 = 26,
  s28 = 28,
  s30 = 30,
  s32 = 32,
  s34 = 34,
  s36 = 36,
  s40 = 40,
  s44 = 44,
  s48 = 48,
  s56 = 56,
  s58 = 58,
  s60 = 60,
  s64 = 64,
  s70 = 70,
  s72 = 72,
  s76 = 76,
  s80 = 80,
}

/**
 * Тип для отступов
 */
export interface SpacingsProps {
  padding?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

/**
 * Хелпер для применения отступов
 */
export const spacings = (props: SpacingsProps) => ({
  ...(props.padding !== undefined && { padding: props.padding }),
  ...(props.paddingVertical !== undefined && { paddingVertical: props.paddingVertical }),
  ...(props.paddingHorizontal !== undefined && { paddingHorizontal: props.paddingHorizontal }),
  ...(props.paddingTop !== undefined && { paddingTop: props.paddingTop }),
  ...(props.paddingBottom !== undefined && { paddingBottom: props.paddingBottom }),
  ...(props.paddingLeft !== undefined && { paddingLeft: props.paddingLeft }),
  ...(props.paddingRight !== undefined && { paddingRight: props.paddingRight }),
  ...(props.margin !== undefined && { margin: props.margin }),
  ...(props.marginVertical !== undefined && { marginVertical: props.marginVertical }),
  ...(props.marginHorizontal !== undefined && { marginHorizontal: props.marginHorizontal }),
  ...(props.marginTop !== undefined && { marginTop: props.marginTop }),
  ...(props.marginBottom !== undefined && { marginBottom: props.marginBottom }),
  ...(props.marginLeft !== undefined && { marginLeft: props.marginLeft }),
  ...(props.marginRight !== undefined && { marginRight: props.marginRight }),
});
