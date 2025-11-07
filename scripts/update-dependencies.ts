import { readFileSync, writeFileSync } from "node:fs";
import { versions } from "../version-config.json";

const packagePath = "./package.json";
const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));

// Update dependencies
if (pkg.dependencies) {
	Object.keys(pkg.dependencies).forEach((dep) => {
		if (dep.startsWith("@teardown")) {
			pkg.dependencies[dep] = `^${versions["@teardown"]}`;
		} else if (versions[dep]) {
			pkg.dependencies[dep] = `^${versions[dep]}`;
		}
	});
}

// Update devDependencies
if (pkg.devDependencies) {
	Object.keys(pkg.devDependencies).forEach((dep) => {
		if (dep.startsWith("@types/react")) {
			pkg.devDependencies[dep] = `^${versions.react}`;
		}
	});
}

writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
