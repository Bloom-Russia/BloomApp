module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // 1. Метаданные TypeScript ДОЛЖНЫ быть первыми
    'babel-plugin-transform-typescript-metadata',

    // 2. Декораторы (legacy: true обязательно для Inversify/MobX)
    ['@babel/plugin-proposal-decorators', { legacy: true }],

    // 3. Свойства классов для Hermes
    ['@babel/plugin-transform-class-properties', { loose: true }],

    // 4. Module Resolver для алиасов
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
          '@core': './src/core',
          '@core/i18n': './src/core/i18n',
          '@core/utils': './src/core/utils',
          '@core/di': './src/core/di',
          '@core/styles': './src/core/styles',
          '@core/services': './src/core/services',
          '@domain': './src/domain',
          '@domain/entities': './src/domain/entities',
          '@domain/usecases': './src/domain/usecases',
          '@domain/repositories': './src/domain/repositories',
          '@data': './src/data',
          '@data/repositories': './src/data/repositories',
          '@data/datasources': './src/data/datasources',
          '@data/mappers': './src/data/mappers',
          '@presentation': './src/presentation',
          '@screens': './src/presentation/screens',
          '@components': './src/presentation/components',
          '@components/common': './src/presentation/components/common',
          '@components/forms': './src/presentation/components/forms',
          '@stores': './src/presentation/stores',
          '@hooks': './src/presentation/hooks',
          '@forms': './src/presentation/forms',
          '@navigation': './src/presentation/navigation',
          '@services': './src/presentation/services',
          '@app': './src/app',
          '@app/providers': './src/app/providers',
          '@shared': './src/shared',
          '@assets': './assets',
          '@assets/images': './assets/images',
          '@i18n': './src/core/i18n',
          '@utils': './src/core/utils',
          '@styles': './src/core/styles',
        },
      },
    ],

    // 5. Reanimated ВСЕГДА строго в самом конце
    'react-native-reanimated/plugin',
  ],
};
