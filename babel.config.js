module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          'PinCodeScreen.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@screens': './src/screens/index.ts',
          '@navigation': './src/navigation/index.ts',
          '@hooks': './src/hooks/index.ts',
          '@UIKit': './src/UIKit/index.ts',
          '@utils': './src/utils/index.ts',
          '@contexts': './src/contexts/index.ts',
          '@config': './src/config.ts',
          '@services': './src/services/index.ts',
          '^@assets/(.+)': './assets/\\1',
        },
      },
    ],
    'react-native-reanimated/plugin',
    ['@babel/plugin-transform-private-methods', { loose: true }],
  ],
};
