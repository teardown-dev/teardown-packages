import Reactotron from 'reactotron-react-native';

Reactotron?.configure({
  name: 'Teardown Navigate Example',
})
  .useReactNative()
  .connect();
console.log('Reactotron Configured');
