import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/app/App';

// if (__DEV__) {
//   import('reactotron-react-native')
//     .then(({ default: Reactotron }) => {
//       Reactotron.configure({
//         host: '192.168.1.54',
//         name: 'Bloom',
//         port: 9090,
//       })
//         .useReactNative({
//           networking: {
//             ignoreUrls: /symbolicate|logs/,
//           },
//           overlay: false,
//         })
//         .connect();
//     })
//     .catch((error) => {
//       console.warn('Reactotron not available:', error.message);
//     });
// }

AppRegistry.registerComponent(appName, () => App);
