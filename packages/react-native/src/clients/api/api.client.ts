import * as Eden from "@elysiajs/eden";
import * as IngestApi from "@teardown/ingest-api";
import type { LoggingClient } from "../logging";
import type { StorageClient } from "../storage";

export { Eden, IngestApi };

const TEARDOWN_INGEST_URL = "http://localhost:4880"
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

	public client: IngestApi.Client;

	constructor(
		_logging: LoggingClient,
		_storage: StorageClient,
		private readonly options: ApiClientOptions
	) {
		// this.storage = storage.createStorage("api");

		this.client = IngestApi.client(TEARDOWN_INGEST_URL, {
			headers: {
				[TEARDOWN_API_KEY_HEADER]: `Bearer ${this.options.apiKey}`,
				[TEARDOWN_ORG_ID_HEADER]: this.options.orgId,
				[TEARDOWN_PROJECT_ID_HEADER]: this.options.projectId,
			},
		});
	}

	get projectId(): string {
		return this.options.projectId;
	}

	get orgId(): string {
		return this.options.orgId;
	}

	get apiKey(): string {
		return this.options.apiKey;
	}

}
