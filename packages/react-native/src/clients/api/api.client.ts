import { createIngestClient, type Endpoints, type IngestClient, type RequestOptions } from "@teardown/ingest-api";
import type { LoggingClient } from "../logging";
import type { StorageClient } from "../storage";

export type { IngestClient, Endpoints, RequestOptions };

const TEARDOWN_INGEST_URL = "https://ingest.teardown.dev";
const TEARDOWN_API_KEY_HEADER = "td-api-key";
const TEARDOWN_ORG_ID_HEADER = "td-org-id";
const TEARDOWN_PROJECT_ID_HEADER = "td-project-id";
const TEARDOWN_ENVIRONMENT_SLUG_HEADER = "td-environment-slug";

export interface ApiClientOptions {
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
	 *
	 * @default "production"
	 */
	environment_slug?: string | null;
	/**
	 * The URL of the ingest API.
	 * @default https://ingest.teardown.dev
	 */
	ingestUrl?: string;
}

export class ApiClient {
	public client: IngestClient;

	constructor(
		_logging: LoggingClient,
		_storage: StorageClient,
		private readonly options: ApiClientOptions
	) {
		this.client = createIngestClient({
			baseUrl: options.ingestUrl ?? TEARDOWN_INGEST_URL,
			headers: {
				[TEARDOWN_API_KEY_HEADER]: `Bearer ${this.apiKey}`,
				[TEARDOWN_ORG_ID_HEADER]: this.orgId,
				[TEARDOWN_PROJECT_ID_HEADER]: this.projectId,
				[TEARDOWN_ENVIRONMENT_SLUG_HEADER]: this.environmentSlug,
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
		return this.options.environment_slug ?? "production";
	}

	get ingestUrl(): string {
		return this.options.ingestUrl ?? TEARDOWN_INGEST_URL;
	}
}
