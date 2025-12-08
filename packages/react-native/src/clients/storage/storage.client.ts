import type { Logger, LoggingClient } from "../logging";
import type { StorageAdapter, SupportedStorage } from "./adapters/storage.adpater-interface";


export class StorageClient {

  private readonly logger: Logger;

  private readonly storage: Map<string, SupportedStorage> = new Map();

  constructor(
    logging: LoggingClient,
    private readonly orgId: string,
    private readonly projectId: string,
    private readonly storageAdapter: StorageAdapter) {
    this.logger = logging.createLogger({
      name: "StorageClient",
    });
  }

  private createStorageKey(storageKey: string): string {
    return `teardown:v1:${this.orgId}:${this.projectId}:${storageKey}`;
  }

  createStorage(storageKey: string): SupportedStorage {
    const fullStorageKey = this.createStorageKey(storageKey);

    this.logger.debug(`Creating storage for ${fullStorageKey}`);
    if (this.storage.has(fullStorageKey)) {
      this.logger.debug(`Storage already exists for ${fullStorageKey}`);
      const existingStorage = this.storage.get(fullStorageKey);

      if (existingStorage != null) {
        this.logger.debug(`Returning existing storage for ${fullStorageKey}`);
        return existingStorage;
      }

      this.logger.error(`Existing storage was found for ${fullStorageKey}, but it was null`);
    }

    this.logger.debug(`Creating new storage for ${fullStorageKey}`);
    const newStorage = this.storageAdapter.createStorage(fullStorageKey);
    newStorage.preload();

    const remappedStorage = {
      ...newStorage,
      clear: () => {
        this.logger.debug(`Clearing storage for ${fullStorageKey}`);
        this.storage.delete(fullStorageKey);
      },
    }

    this.storage.set(fullStorageKey, remappedStorage);
    this.logger.debug(`Storage created for ${fullStorageKey}`);

    return remappedStorage;
  }

  shutdown(): void {
    this.storage.forEach((storage) => {
      storage.clear();
    });
    this.storage.clear();
  }
}