import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

/**
 * Gets the local IP address of the machine.
 */
function getLocalIp(): string {
	const nets = networkInterfaces();

	// Prefer en0 (WiFi on Mac)
	const en0 = nets.en0?.find((net) => net.family === "IPv4" && !net.internal);
	if (en0) return en0.address;

	// Fallback: find first non-internal IPv4
	for (const name of Object.keys(nets)) {
		const net = nets[name]?.find((n) => n.family === "IPv4" && !n.internal);
		if (net) return net.address;
	}

	return "localhost";
}

const localIp = getLocalIp();
const ingestUrl = `http://${localIp}:4501`;

console.log(`Local IP: ${localIp}`);
console.log(`Ingest URL: ${ingestUrl}`);
console.log("");

// Spawn expo with the env var
const expo = spawn("bunx", ["expo", "start", "--clear"], {
	stdio: "inherit",
	env: {
		...process.env,
		EXPO_PUBLIC_INGEST_URL: ingestUrl,
	},
});

expo.on("exit", (code) => {
	process.exit(code ?? 0);
});
