import { fetch } from "bun";
import net from "node:net";
export enum DevServerStatusResultEnum {
	PACKAGER_STATUS_RUNNING = "packager-status:running",
}

export enum DevServerStatusEnum {
	NOT_RUNNING = "not_running",
	MATCHED_SERVER_RUNNING = "matched_server_running",
	PORT_TAKEN = "port_taken",
	UNKNOWN = "unknown",
}

export type DevServerOptions = {
	host: string;
	port: number;
	projectRoot: string;
	devServerStatusPath?: string;
};

export class DevServerChecker {
	constructor(readonly options: DevServerOptions) {}

	private getUrl() {
		const devServerStatusPath = this.options.devServerStatusPath ?? "/status";
		return `${this.options.host}:${this.options.port}${devServerStatusPath}`;
	}

	async getServerStatus(): Promise<DevServerStatusEnum> {
		try {
			if (!(await this.isPortInUse(this.options.host, this.options.port))) {
				return DevServerStatusEnum.NOT_RUNNING;
			}

			const statusResponse = await fetch(this.getUrl());
			const body = await statusResponse.text();

			if (body !== DevServerStatusResultEnum.PACKAGER_STATUS_RUNNING) {
				return DevServerStatusEnum.PORT_TAKEN;
			}

			const projectRoot = statusResponse.headers.get(
				"X-React-Native-Project-Root",
			);

			if (projectRoot !== this.options.projectRoot) {
				return DevServerStatusEnum.PORT_TAKEN;
			}

			return DevServerStatusEnum.MATCHED_SERVER_RUNNING;
		} catch (error) {
			console.error(error);
			return DevServerStatusEnum.UNKNOWN;
		}
	}

	private async isPortInUse(hostname: string, port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const server = net.createServer();

			server.once("error", (e: NodeJS.ErrnoException) => {
				console.log("Server error:", e);
				server.close();
				if (e.code === "EADDRINUSE") {
					resolve(true);
				} else {
					// For any other errors, assume port is not in use
					resolve(false);
				}
			});

			server.once("listening", () => {
				server.close();
				resolve(false);
			});

			server.listen(port, hostname);
		});
	}
}
