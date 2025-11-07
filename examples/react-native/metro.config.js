const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const path = require("node:path");
const metroPlugin = require("@teardown/react-native/metro");

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
	"cli",
	"config",
	"event-emitter",
	"logger",
	"util",
	"react-native",
	"react-native-ui",
	"websocket",
];

const { watchFolders, extraNodeModules } = resolvePackages(
	packageRoot,
	packages,
);

// Add node_modules to watch folders
const nodeModulesPath = path.resolve(__dirname, "node_modules");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	watchFolders: [
		...watchFolders,
		// nodeModulesPath,
	],
	resolver: {
		extraNodeModules: new Proxy(extraNodeModules, {
			get: (target, name) =>
				name in target
					? target[name]
					: path.join(process.cwd(), `node_modules/${name}`),
		}),
		unstable_enableSymlinks: true, // Enable symlink support explicitly
	},
	resetCache: true,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
