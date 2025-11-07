const { getDefaultConfig: getDefaultExpoConfig } = require('expo/metro-config');
const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const config = mergeConfig(
    getDefaultConfig(__dirname),
    getDefaultExpoConfig(__dirname),
    {
  /* your config */
});

module.exports = withNativeWind(config, {input: './src/theme/global.css'});
