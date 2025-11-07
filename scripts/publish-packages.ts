import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const PACKAGES_DIR = "./packages";
const SCOPE = "@teardown";
const DRY_RUN = process.env.DRY_RUN === "true";
const ACCESS = "public"; // or 'restricted' for private packages

// Add colors for better visibility
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

function log(
	message: string,
	type: "info" | "success" | "error" | "warning" | "step" = "info",
) {
	const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
	const prefix = `${colors.dim}[${timestamp}]${colors.reset}`;

	switch (type) {
		case "success":
			console.log(`${prefix} ${colors.green}✅ ${message}${colors.reset}`);
			break;
		case "error":
			console.error(`${prefix} ${colors.red}❌ ${message}${colors.reset}`);
			break;
		case "warning":
			console.warn(`${prefix} ${colors.yellow}⚠️  ${message}${colors.reset}`);
			break;
		case "step":
			console.log(`${prefix} ${colors.cyan}📦 ${message}${colors.reset}`);
			break;
		default:
			console.log(`${prefix} ℹ️  ${message}`);
	}
}

interface Package {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	private?: boolean;
}

log(`Starting package discovery in ${PACKAGES_DIR}`, "step");
const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => join(PACKAGES_DIR, dirent.name));

log(`Found ${packageDirs.length} potential package directories`, "info");

const packages = new Map<
	string,
	{ pkg: Package; path: string; dependencies: Set<string> }
>();

// First pass: collect all packages and their dependencies
packageDirs.forEach((packagePath) => {
	try {
		const pkgJsonPath = join(packagePath, "package.json");
		log(`Reading ${pkgJsonPath}...`);

		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as Package;
		if (pkg.private) {
			log(`Skipping private package: ${pkg.name}`, "info");
			return;
		}

		if (!pkg.name.startsWith(SCOPE)) {
			log(`Skipping non-scoped package: ${pkg.name}`, "info");
			return;
		}

		const deps = new Set<string>();
		let internalDepsCount = 0;

		// Collect all internal dependencies
		["dependencies", "devDependencies", "peerDependencies"].forEach(
			(depType) => {
				const dependencies = pkg[depType as keyof Package] as
					| Record<string, string>
					| undefined;
				if (dependencies) {
					Object.keys(dependencies).forEach((dep) => {
						if (dep.startsWith(SCOPE)) {
							deps.add(dep);
							internalDepsCount++;
						}
					});
				}
			},
		);

		packages.set(pkg.name, { pkg, path: packagePath, dependencies: deps });
		log(
			`Added ${pkg.name}@${pkg.version} (${internalDepsCount} internal dependencies)`,
			"success",
		);
	} catch (error) {
		log(`Error reading package.json in ${packagePath}: ${error}`, "error");
	}
});

async function packageExists(name: string, version: string): Promise<boolean> {
	log(`Checking if ${name}@${version} exists...`);
	try {
		const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
			encoding: "utf8",
		});
		return result.status === 0;
	} catch {
		return false;
	}
}

async function publishPackage(
	name: string,
	packagePath: string,
): Promise<boolean> {
	log(`Publishing ${name}...`, "step");
	log(`Package location: ${packagePath}`);

	if (DRY_RUN) {
		log("DRY RUN - skipping actual publish", "warning");
		return true;
	}

	log("Running bun publish...");
	const result = spawnSync("bun", ["publish", "--access", ACCESS], {
		cwd: packagePath,
		stdio: "inherit",
		encoding: "utf8",
	});

	if (result.status === 0) {
		log(`Successfully published ${name}`, "success");
		return true;
	}

	log(`Failed to publish ${name} (exit code: ${result.status})`, "error");
	if (result.stderr) log(`Error output: ${result.stderr}`, "error");
	return false;
}

function getPublishOrder(): string[] {
	log("Calculating publication order...", "step");
	const visited = new Set<string>();
	const order: string[] = [];

	function visit(name: string) {
		if (visited.has(name)) return;
		visited.add(name);

		const pkg = packages.get(name);
		if (pkg) {
			pkg.dependencies.forEach((dep) => {
				if (packages.has(dep)) {
					log(`  ${name} depends on ${dep}`);
					visit(dep);
				}
			});
			order.push(name);
		}
	}

	packages.forEach((_, name) => visit(name));
	log(`Publication order determined: ${order.join(" → ")}`, "success");
	return order;
}

async function main() {
	log(
		`${DRY_RUN ? "[DRY RUN] " : ""}Starting package publication process...`,
		"step",
	);
	log(`Scope: ${SCOPE}`);
	log(`Access: ${ACCESS}`);

	const publishOrder = getPublishOrder();
	log(`Found ${publishOrder.length} packages to process`);

	// Verify versions before publishing
	log("Verifying package versions...", "step");
	for (const name of publishOrder) {
		const p = packages.get(name);
		if (p == null) {
			log(`Package ${name} not found - skipping`, "error");
			continue;
		}
		const { pkg } = p;
		const exists = await packageExists(pkg.name, pkg.version);

		if (exists) {
			log(
				`${pkg.name}@${pkg.version} already exists on npm - skipping`,
				"warning",
			);
			packages.delete(name);
		} else {
			log(`${pkg.name}@${pkg.version} is ready for publication`, "success");
		}
	}

	// Publish packages in order
	let success = true;
	let published = 0;
	let skipped = 0;

	for (const name of publishOrder) {
		if (packages.has(name)) {
			const p = packages.get(name);
			if (p == null) {
				log(`Package ${name} not found - skipping`, "error");
				continue;
			}
			const { path } = p;

			success = await publishPackage(name, path);

			if (success) {
				published++;
			} else {
				log("Publication process failed", "error");
				process.exit(1);
			}
		} else {
			skipped++;
		}
	}

	log("\nPublication Summary:", "step");
	log(`Total packages processed: ${publishOrder.length}`);
	log(`Published: ${published}`);
	log(`Skipped: ${skipped}`);
	log("Publication process complete! 🎉", "success");
}

// Run the publication process
main().catch((error) => {
	log(`Unexpected error: ${error}`, "error");
	process.exit(1);
});
