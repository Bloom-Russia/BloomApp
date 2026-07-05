module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@core': './src/core',
          '@domain': './src/domain',
          '@data': './src/data',
          '@components': './src/presentation/components',
          '@forms': './src/presentation/forms',
          '@stores': './src/presentation/stores',
          '@hooks': './src/presentation/hooks',
          '@navigation': './src/presentation/navigation',
          '@screens': './src/presentation/screens',
          '@services': './src/presentation/services',
          '@app': './src/app',
          '@assets': './assets',
        },
      },
    ],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    'react-native-reanimated/plugin',
  ],
};
