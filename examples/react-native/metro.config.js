const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const path = require("path");

const teardown_ReactNative = path.resolve(
	__dirname,
	"../../packages/react-native",
);
const teardown_ReactNativeNavigation = path.resolve(
	__dirname,
	"../../packages/react-native-navigation",
);
const teardown_ReactNativeUI = path.resolve(
	__dirname,
	"../../packages/react-native-ui",
);
const teardown_Logger = path.resolve(__dirname, "../../packages/logger");
const teardown_Websocket = path.resolve(__dirname, "../../packages/websocket");
const teardown_Util = path.resolve(__dirname, "../../packages/util");
const teardown_EventEmitter = path.resolve(
	__dirname,
	"../../packages/event-emitter",
);
const extraNodeModules = {
	"@teardown/logger": teardown_Logger,
	"@teardown/util": teardown_Util,
	"@teardown/event-emitter": teardown_EventEmitter,
	"@teardown/websocket": teardown_Websocket,
	"@teardown/react-native": teardown_ReactNative,
	"@teardown/react-native-ui": teardown_ReactNativeUI,
	"@teardown/react-native-navigation": teardown_ReactNativeNavigation,
};
const watchFolders = [
	// Include extra module dir to work around Metro's bug where resolver.extraNodeModules
	// does not work without corresponding watchFolders, see also
	// https://github.com/facebook/metro/issues/834
	teardown_Logger,
	teardown_Util,
	teardown_EventEmitter,
	teardown_Websocket,
	teardown_ReactNative,
	teardown_ReactNativeUI,
	teardown_ReactNativeNavigation,
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
				name in target
					? target[name]
					: path.join(process.cwd(), `node_modules/${name}`),
		}),
		// unstable_enableSymlinks: true,  // defaults to true since Metro v0.79.0
	},
	resetCache: true, // https://metrobundler.dev/docs/configuration/#resetcache
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
