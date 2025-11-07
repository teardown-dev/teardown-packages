import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import {Main} from './src/main';
import 'react-native-get-random-values';

AppRegistry.registerComponent(appName, () => Main);
