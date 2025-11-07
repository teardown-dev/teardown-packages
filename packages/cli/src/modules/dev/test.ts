import type { Server as BunServer } from "bun";
import { createReadStream, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { lookup } from "mime-types";
import { basename, join, resolve } from "node:path";
import { parse as parseUrl } from "node:url";

type BundleOptions = {
	entryFile: string;
	platform?: string;
	dev?: boolean;
	minify?: boolean;
	sourceMaps?: boolean;
};

type AssetData = {
	path: string;
	hash: string;
	name: string;
	type: string;
};

class MetroServer {
	private projectRoot: string;
	private watchFolders: string[];
	private platforms: Set<string>;
	private bundleCache: Map<string, { code: string; map?: string }>;

	constructor(config: {
		projectRoot: string;
		watchFolders?: string[];
		platforms?: string[];
	}) {
		this.projectRoot = config.projectRoot;
		this.watchFolders = config.watchFolders || [config.projectRoot];
		this.platforms = new Set(config.platforms || ["ios", "android"]);
		this.bundleCache = new Map();
	}

	// Main request handler
	async processRequest(req: IncomingMessage, res: ServerResponse) {
		try {
			const urlObj = parseUrl(req.url || "", true);
			const pathname = urlObj.pathname || "";

			if (pathname.endsWith(".bundle")) {
				await this.processBundleRequest(req, res);
			} else if (pathname.endsWith(".map")) {
				await this.processSourceMapRequest(req, res);
			} else if (pathname.endsWith(".assets")) {
				await this.processAssetsRequest(req, res);
			} else if (pathname.startsWith("/assets/")) {
				await this.processSingleAssetRequest(req, res);
			} else {
				res.writeHead(404);
				res.end("Not found");
			}
		} catch (error) {
			console.error("Error processing request:", error);
			res.writeHead(500);
			res.end(
				JSON.stringify({
					error: error instanceof Error ? error.message : String(error),
				}),
			);
		}
	}

	// Parse bundle options from URL
	private parseOptionsFromUrl(reqUrl: string): BundleOptions {
		const urlObj = parseUrl(reqUrl, true);
		const query = urlObj.query;

		return {
			entryFile: (query.entryFile as string) || "index.js",
			platform: query.platform as string,
			dev: query.dev !== "false",
			minify: query.minify === "true",
			sourceMaps: query.sourceMaps !== "false",
		};
	}

	// Bundle processing
	private async processBundleRequest(
		req: IncomingMessage,
		res: ServerResponse,
	) {
		const options = this.parseOptionsFromUrl(req.url || "");
		const bundleKey = this.getBundleCacheKey(options);

		let bundle = this.bundleCache.get(bundleKey);
		if (!bundle) {
			bundle = await this.createBundle(options);
			this.bundleCache.set(bundleKey, bundle);
		}

		res.setHeader("Content-Type", "application/javascript");
		res.setHeader("Content-Length", bundle.code.length);
		res.end(bundle.code);
	}

	// Source map processing
	private async processSourceMapRequest(
		req: IncomingMessage,
		res: ServerResponse,
	) {
		const options = this.parseOptionsFromUrl(req.url || "");
		const bundleKey = this.getBundleCacheKey(options);
		const bundle = this.bundleCache.get(bundleKey);

		if (!bundle || !bundle.map) {
			res.writeHead(404);
			res.end("Source map not found");
			return;
		}

		res.setHeader("Content-Type", "application/json");
		res.end(bundle.map);
	}

	// Asset processing
	private async processSingleAssetRequest(
		req: IncomingMessage,
		res: ServerResponse,
	) {
		const urlObj = parseUrl(req.url || "", true);
		const assetPath = urlObj.pathname?.replace(/^\/assets\//, "");

		if (!assetPath) {
			res.writeHead(400);
			res.end("Invalid asset path");
			return;
		}

		try {
			const fullPath = join(this.projectRoot, "assets", assetPath);
			const stream = createReadStream(fullPath);

			res.setHeader(
				"Content-Type",
				lookup(basename(assetPath)) || "application/octet-stream",
			);
			stream.pipe(res);

			stream.on("error", (error: NodeJS.ErrnoException) => {
				if (error.code === "ENOENT") {
					res.writeHead(404);
					res.end("Asset not found");
				} else {
					res.writeHead(500);
					res.end("Error reading asset");
				}
			});
		} catch (error) {
			res.writeHead(500);
			res.end("Error processing asset request");
		}
	}

	// Assets list processing
	private async processAssetsRequest(
		req: IncomingMessage,
		res: ServerResponse,
	) {
		const options = this.parseOptionsFromUrl(req.url || "");
		const assets = await this.getAssets(options);

		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(assets));
	}

	// Bundle creation
	private async createBundle(
		options: BundleOptions,
	): Promise<{ code: string; map?: string }> {
		const entryPoint = resolve(this.projectRoot, options.entryFile);

		try {
			// Simple bundle creation for example - in reality, would need proper module resolution,
			// dependency graph traversal, and transformations
			const code = readFileSync(entryPoint, "utf8");

			// Basic source map generation
			const map = options.sourceMaps
				? {
						version: 3,
						sources: [options.entryFile],
						names: [],
						mappings: "", // Would need proper source map generation
						file: basename(options.entryFile),
					}
				: undefined;

			return {
				code: code,
				map: map ? JSON.stringify(map) : undefined,
			};
		} catch (error) {
			throw new Error(
				`Failed to create bundle: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Asset resolution
	private async getAssets(options: BundleOptions): Promise<AssetData[]> {
		// Simple asset discovery - would need proper asset resolution in reality
		return [];
	}

	// Helper to generate cache keys for bundles
	private getBundleCacheKey(options: BundleOptions): string {
		return `${options.entryFile}-${options.platform}-${options.dev}-${options.minify}`;
	}

	// Create and start the server
	public listen(port = 8081): BunServer {
		return Bun.serve({
			port,
			fetch: async (request: Request) => {
				const { pathname } = new URL(request.url);

				// Convert Bun's Request to Node's IncomingMessage-like object
				const req = {
					url: request.url,
					method: request.method,
					headers: Object.fromEntries(request.headers),
				} as IncomingMessage;

				// Create a response object that mimics Node's ServerResponse
				let statusCode = 200;
				const headers = new Headers();
				let body = "";

				const res = {
					writeHead: (
						status: number,
						responseHeaders?: Record<string, string>,
					) => {
						statusCode = status;
						if (responseHeaders) {
							Object.entries(responseHeaders).forEach(([key, value]) => {
								headers.set(key, value);
							});
						}
					},
					setHeader: (name: string, value: string) => {
						headers.set(name, value);
					},
					end: (chunk?: string | Buffer) => {
						if (chunk) {
							body = chunk.toString();
						}
					},
				} as unknown as ServerResponse;

				// Process the request
				await this.processRequest(req, res);

				// Convert the response to Bun's Response format
				return new Response(body, {
					status: statusCode,
					headers,
				});
			},
		});
	}
}

// Export the server
export default MetroServer;
