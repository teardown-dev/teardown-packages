import { networkInterfaces } from "node:os";

/**
 * Gets the local IP address of the machine.
 * Prefers en0 (WiFi on Mac) but falls back to first non-internal IPv4.
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

const ip = getLocalIp();
console.log(ip);
