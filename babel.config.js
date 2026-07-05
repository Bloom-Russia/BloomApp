module.exports = {
  presets: [['module:@react-native/babel-preset']],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/presentation/components/index.ts',
          '@assets': './assets',
          '@core': './src/core',
          '@core/styles': './src/core/styles',
          '@core/di': './src/core/di',
          '@domain': './src/domain/index.ts',
          '@data': './src/data',
          '@stores': './src/presentation/stores',
          '@services': './src/presentation/services',
          // '@forms': './src/presentation/forms/index.ts',
          // '@screens': './src/presentation/screens/index.ts',
          '@navigation': './src/presentation/navigation',
          '@hooks': './src/presentation/hooks/index.ts',
          '@app': './src/app',
        },
      },
    ],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    'react-native-reanimated/plugin',
  ],
};
