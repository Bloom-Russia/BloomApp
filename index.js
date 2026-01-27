// index.js
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import Reactotron from 'reactotron-react-native';

Reactotron.configure({
  host: '192.168.0.235',
  name: 'Bloom',
  port: 9090,
})
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate|logs/,
    },
    overlay: false,
  })
  .connect();

AppRegistry.registerComponent(appName, () => App);
