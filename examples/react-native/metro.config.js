const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');


const path = require('path');

const myExtraModuleDir = path.resolve(__dirname, '../../packages/react-native');
const extraNodeModules = {
    '@teardown/react-native': myExtraModuleDir,
};
const watchFolders = [
    // Include extra module dir to work around Metro's bug where resolver.extraNodeModules
    // does not work without corresponding watchFolders, see also
    // https://github.com/facebook/metro/issues/834
    myExtraModuleDir,
];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    watchFolders: watchFolders,
    resolver: {
        extraNodeModules: new Proxy(extraNodeModules, {
            get: (target, name) =>
                // redirects dependencies referenced from myExtraModule/ to local node_modules
                name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`),
        }),
        // unstable_enableSymlinks: true,  // defaults to true since Metro v0.79.0
    },
    resetCache: true,  // https://metrobundler.dev/docs/configuration/#resetcache
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
