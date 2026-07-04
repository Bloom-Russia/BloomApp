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
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          /* Core */
          '@core': './src/core',
          '@core/i18n': './src/core/i18n',
          '@core/utils': './src/core/utils',
          '@core/di': './src/core/di',
          '@core/styles': './src/core/styles',

          /* Domain */
          '@domain': './src/domain',
          '@domain/entities': './src/domain/entities',
          '@domain/usecases': './src/domain/usecases',
          '@domain/repositories': './src/domain/repositories',

          /* Data */
          '@data': './src/data',
          '@data/repositories': './src/data/repositories',
          '@data/datasources': './src/data/datasources',
          '@data/mappers': './src/data/mappers',

          /* Presentation */
          '@presentation': './src/presentation',
          '@screens': './src/presentation/screens',
          '@components': './src/presentation/components',
          '@stores': './src/presentation/stores',
          '@hooks': './src/presentation/hooks',
          '@forms': './src/presentation/forms',
          '@navigation': './src/presentation/navigation',
          '@services': './src/presentation/services',

          /* App & Shared */
          '@app': './src/app',
          '@shared': './src/shared',
          '@assets': './assets',
          '@i18n': './src/core/i18n',
          '@utils': './src/core/utils',
        },
      },
    ],
    // ✅ Исправлено: используем version: 'legacy' вместо { legacy: true }
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    'babel-plugin-transform-typescript-metadata',
    'react-native-reanimated/plugin',
  ],
};
