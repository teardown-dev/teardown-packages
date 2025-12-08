import type { Logger, LoggingClient } from "../logging";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
export class UtilsClient {
	private readonly logger: Logger;

	constructor(logging: LoggingClient) {
		this.logger = logging.createLogger({
			name: "UtilsClient",
		});
	}

	async generateRandomUUID(): Promise<string> {
		this.logger.debug("Generating random UUID");
		const uuid = uuidv4();
		this.logger.debug(`Random UUID generated: ${uuid}`);
		return uuid;
	}
}
