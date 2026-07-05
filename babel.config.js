module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@core': './src/core',
          //'@domain': './src/domain/index.ts',
          '@data': './src/data',
          '@components': './src/presentation/components/index.ts',
          // '@forms': './src/presentation/forms',
          '@stores': './src/presentation/stores/index.ts',
          '@hooks': './src/presentation/hooks/index.ts',
          //'@navigation': './src/presentation/navigation/index.ts',
          // '@screens': './src/presentation/screens/index.ts',
          '@services': './src/presentation/services',
          '@app': './src/app',
          '^@assets/(.+)': './assets/\\1',
        },
      },
    ],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    'react-native-reanimated/plugin',
  ],
};
