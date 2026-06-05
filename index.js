// index.js
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import Reactotron from 'reactotron-react-native';
import Config from 'react-native-config';

Reactotron.configure({
  host: Config.API_URL,
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
