module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
  moduleNameMapper: {
    // Добавьте все алиасы, которые есть в babel.config.js
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@hooks/(.*)$': '<rootDir>/src/presentation/hooks/$1',
    '^@stores/(.*)$': '<rootDir>/src/presentation/stores/$1',
    '^@screens/(.*)$': '<rootDir>/src/presentation/screens/$1',
    '^@components/(.*)$': '<rootDir>/src/presentation/components/$1',
    '^@navigation/(.*)$': '<rootDir>/src/presentation/navigation/$1',
    '^@services/(.*)$': '<rootDir>/src/presentation/services/$1',
    '^@forms/(.*)$': '<rootDir>/src/presentation/forms/$1',
    '^@i18n$': '<rootDir>/src/core/i18n',
    '^@utils$': '<rootDir>/src/core/utils',
  },
};
