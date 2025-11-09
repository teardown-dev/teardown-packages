import * as IngestApi from "@teardown/ingest-api";
import type { Logger, LoggingClient } from "../logging";
import type { StorageClient } from "../storage";

const TEARDOWN_INGEST_URL = "https://ingest.teardown.dev";
const TEARDOWN_API_KEY_HEADER = "td-api-key";
const TEARDOWN_ORG_ID_HEADER = "td-org-id";
const TEARDOWN_PROJECT_ID_HEADER = "td-project-id";

export type ApiClientOptions = {
	apiKey: string;
	orgId: string;
	projectId: string;
	onRequest?: (endpoint: IngestApi.Endpoints, options: IngestApi.RequestOptions) => Promise<IngestApi.RequestOptions>;
};

export class ApiClient {
	private logger: Logger;
	// private storage: SupportedStorage;
	private client: ReturnType<typeof IngestApi.client>;

	constructor(
		logging: LoggingClient,
		_storage: StorageClient,
		private readonly options: ApiClientOptions
	) {
		this.logger = logging.createLogger({
			name: "ApiClient",
		});
		// this.storage = storage.createStorage("api");

		this.client = IngestApi.client(TEARDOWN_INGEST_URL, {
			headers: {
				[TEARDOWN_API_KEY_HEADER]: `Bearer ${this.options.apiKey}`,
				[TEARDOWN_ORG_ID_HEADER]: this.options.orgId,
				[TEARDOWN_PROJECT_ID_HEADER]: this.options.projectId,
			},
		});
	}

	private generateBaseHeaders(): Record<string, string> {
		const headersOut: Record<string, string> = {};

		if (this.options.apiKey == null || this.options.apiKey.trim() === "") {
			this.logger.error("Teardown API key is required");
		} else {
			headersOut[TEARDOWN_API_KEY_HEADER] = `Bearer ${this.options.apiKey}`;
		}

		if (this.options.orgId == null || this.options.orgId.trim() === "") {
			this.logger.error("Teardown org ID is required");
		} else {
			headersOut[TEARDOWN_ORG_ID_HEADER] = this.options.orgId;
		}

		if (this.options.projectId == null || this.options.projectId.trim() === "") {
			this.logger.error("Teardown project ID is required");
		} else {
			headersOut[TEARDOWN_PROJECT_ID_HEADER] = this.options.projectId;
		}

		return headersOut;
	}

	fetch: typeof this.client = async (endpoint, options) => {
		const baseHeaders = this.generateBaseHeaders();

		const baseOptions: IngestApi.RequestOptions = {
			...(options as IngestApi.RequestOptions),
			headers: {
				...baseHeaders,
				...options?.headers,
			},
		};

		const requestOptions = this.options.onRequest ? await this.options.onRequest(endpoint, baseOptions) : baseOptions;

		return this.client(endpoint, requestOptions as any);
	};
}
