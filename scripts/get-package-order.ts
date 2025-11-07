import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type PackageInfo = {
	name: string;
	path: string;
	dependencies: string[];
	allDependencies: string[];
};

export function getPublishOrder(): string[] {
	const PACKAGES_DIR = "./packages";
	const packages = new Map<string, PackageInfo>();

	// First pass: collect all package info
	readdirSync(PACKAGES_DIR, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.forEach((dirent) => {
			const packagePath = join(PACKAGES_DIR, dirent.name);
			const pkgJson = JSON.parse(
				readFileSync(join(packagePath, "package.json"), "utf-8"),
			);

			// Collect all dependency types
			const allDependencies = [
				...Object.keys(pkgJson.dependencies || {}),
				...Object.keys(pkgJson.peerDependencies || {}),
				...Object.keys(pkgJson.devDependencies || {}),
			];

			// Filter to only include our internal packages
			const internalDeps = allDependencies.filter((dep) =>
				dep.startsWith("@teardown/"),
			);

			packages.set(pkgJson.name, {
				name: pkgJson.name,
				path: packagePath,
				dependencies: internalDeps,
				allDependencies: allDependencies,
			});
		});

	// Topological sort
	const sorted: string[] = [];
	const visited = new Set<string>();
	const temp = new Set<string>();

	function visit(pkgName: string) {
		if (temp.has(pkgName)) {
			throw new Error(`Circular dependency detected: ${pkgName}`);
		}
		if (visited.has(pkgName)) return;

		temp.add(pkgName);
		const pkg = packages.get(pkgName);
		if (pkg) {
			for (const dep of pkg.dependencies) {
				visit(dep);
			}
		}
		temp.delete(pkgName);
		visited.add(pkgName);
		sorted.unshift(pkgName);
	}

	// Visit all packages
	for (const pkgName of packages.keys()) {
		if (!visited.has(pkgName)) {
			visit(pkgName);
		}
	}

	return sorted;
}
