import type { Logger, LoggingClient } from "../logging";

export interface SupportedStorage {
  preload: () => void;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  keys: () => string[];
}

export type SupportedStorageFactory = (storageKey: string) => SupportedStorage;

export interface StorageClientOptions {
  createStorage: SupportedStorageFactory;
}

export class StorageClient {

  private readonly logger: Logger;

  private readonly storage: Map<string, SupportedStorage> = new Map();

  constructor(
    logging: LoggingClient,
    private readonly orgId: string,
    private readonly projectId: string,
    private readonly factory: SupportedStorageFactory) {
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
    const newStorage = this.factory(fullStorageKey);
    newStorage.preload();


    const remappedStorage = {
      ...newStorage,
      clear: () => {
        this.logger.debug(`Clearing storage for ${fullStorageKey}`);
        this.storage.delete(fullStorageKey);
      },
    }

    this.storage.set(fullStorageKey, remappedStorage);
    this.logger.info(`Storage created for ${fullStorageKey}`);

    return remappedStorage;
  }

  shutdown(): void {
    this.storage.forEach((storage) => {
      storage.clear();
    });
    this.storage.clear();
  }
}