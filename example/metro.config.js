const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');
const path = require('path');

const watchFolders = [
  path.resolve(__dirname + '/..'),
  path.resolve(__dirname + '/../node_modules'),
];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders,
});

module.exports = config;
// withNativeWind(config, {
//   input: './src/modules/theme/globals.css',
//   watchFolders,
// });
