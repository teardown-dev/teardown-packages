const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const path = require("node:path");
// const metroPlugin = require("@teardown/react-native-navigation/metro");

/**
 * Resolves the paths for the given packages relative to the provided package root.
 *
 * @param {string} packageRoot - The root directory where the packages are located.
 * @param {string[]} packages - An array of package names to resolve.
 * @returns {{ extraNodeModules: Record<string, string>, watchFolders: string[] }} An object containing the resolved package paths as `extraNodeModules` and `watchFolders`.
 */
function resolvePackages(packageRoot, packages) {
	const resolved = packages.reduce((acc, pkg) => {
		acc[`@teardown/${pkg}`] = path.resolve(__dirname, `${packageRoot}/${pkg}`);
		return acc;
	}, {});

	return {
		extraNodeModules: resolved,
		watchFolders: Object.values(resolved),
	};
}

const packageRoot = path.resolve(__dirname, "../../packages");
const packages = [
	"logger",
	"util",
	"event-emitter",
	"websocket",
	"react-native",
	"react-native-ui",
	"react-native-navigation",
];

const { watchFolders, extraNodeModules } = resolvePackages(
	packageRoot,
	packages,
);

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
	resetCache: true,
};

module.exports = mergeConfig(
	getDefaultConfig(__dirname),
	config,
	// metroPlugin.getConfig(),
);
