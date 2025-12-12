import type * as Eden from "@elysiajs/eden";
import * as IngestApi from "@teardown/ingest-api";
import type { LoggingClient } from "../logging";
import type { StorageClient } from "../storage";

export type { Eden, IngestApi };

const TEARDOWN_INGEST_URL = "http://localhost:4880";// "https://ingest.teardown.dev";
const TEARDOWN_API_KEY_HEADER = "td-api-key";
const TEARDOWN_ORG_ID_HEADER = "td-org-id";
const TEARDOWN_PROJECT_ID_HEADER = "td-project-id";
const TEARDOWN_ENVIRONMENT_SLUG_HEADER = "td-environment-slug";

export type ApiClientOptions = {
	/**
	 * The API key.
	 */
	api_key: string;
	/**
	 * The ID of the organization.
	 */
	org_id: string;
	/**
	 * The ID of the project.
	 */
	project_id: string;
	/**
	 * The slug of the environment.
	 */
	environment_slug: string;
	/**
	 * A function that will be called before each request.
	 * @param endpoint The endpoint being requested.
	 * @param options The options for the request.
	 * @returns The options for the request.
	 */
	onRequest?: (endpoint: IngestApi.Endpoints, options: IngestApi.RequestOptions) => Promise<IngestApi.RequestOptions>;
	/**
	 * The URL of the ingest API.
	 * @default https://ingest.teardown.dev
	 */
	ingestUrl?: string;
};

export class ApiClient {
	public client: IngestApi.Client;

	constructor(
		_logging: LoggingClient,
		_storage: StorageClient,
		private readonly options: ApiClientOptions
	) {
		this.client = IngestApi.client(options.ingestUrl ?? TEARDOWN_INGEST_URL, {
			headers: {
				[TEARDOWN_API_KEY_HEADER]: `Bearer ${this.options.api_key}`,
				[TEARDOWN_ORG_ID_HEADER]: this.options.org_id,
				[TEARDOWN_PROJECT_ID_HEADER]: this.options.project_id,
				[TEARDOWN_ENVIRONMENT_SLUG_HEADER]: this.options.environment_slug,
			},
		});
	}

	get orgId(): string {
		return this.options.org_id;
	}

	get projectId(): string {
		return this.options.project_id;
	}

	get apiKey(): string {
		return this.options.api_key;
	}

	get environmentSlug(): string {
		return this.options.environment_slug;
	}
}
