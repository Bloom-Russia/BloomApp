module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: null,
      },
    },
  },
  project: {
    ios: {
      sourceDir: './ios',
      automaticPodsInstallation: true,
    },
    android: {},
  },
  assets: ['./assets/fonts/'],
};
