import type { Logger, LoggingClient } from "../logging";

export class UtilsClient {
	private readonly logger: Logger;

	constructor(logging: LoggingClient) {
		this.logger = logging.createLogger({
			name: "UtilsClient",
		});
	}

	async generateRandomUUID(seed?: string): Promise<string> {
		this.logger.debug("Generating random UUID");
		// Generate a random UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
		// Uses only Math.random and string manipulation, no dependencies.
		const hex: string[] = [];
		for (let i = 0; i < 256; ++i) {
			hex.push((i < 16 ? "0" : "") + i.toString(16));
		}

		// Seeded random number generator using mulberry32
		let seedValue = 0;
		if (seed) {
			// Simple hash function to convert seed string to number
			for (let i = 0; i < seed.length; i++) {
				seedValue = ((seedValue << 5) - seedValue + seed.charCodeAt(i)) | 0;
			}
			seedValue = Math.abs(seedValue);
		}

		const seededRandom = (): number => {
			seedValue = (seedValue + 0x6d2b79f5) | 0;
			let t = Math.imul(seedValue ^ (seedValue >>> 15), 1 | seedValue);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};

		const getRandomByte = (): number => Math.floor((seed ? seededRandom() : Math.random()) * 256);
		const rnds = new Array(16).fill(0).map(getRandomByte);

		// Per spec:
		rnds[6] = (rnds[6]! & 0x0f) | 0x40; // version 4
		rnds[8] = (rnds[8]! & 0x3f) | 0x80; // variant 10

		const uuid =
			hex[rnds[0]!]! +
			hex[rnds[1]!]! +
			hex[rnds[2]!]! +
			hex[rnds[3]!]! +
			"-" +
			hex[rnds[4]!]! +
			hex[rnds[5]!]! +
			"-" +
			hex[rnds[6]!]! +
			hex[rnds[7]!]! +
			"-" +
			hex[rnds[8]!]! +
			hex[rnds[9]!]! +
			"-" +
			hex[rnds[10]!]! +
			hex[rnds[11]!]! +
			hex[rnds[12]!]! +
			hex[rnds[13]!]! +
			hex[rnds[14]!]! +
			hex[rnds[15]!]!;

		this.logger.debug(`Random UUID generated: ${uuid}`);
		return uuid;
	}
}
