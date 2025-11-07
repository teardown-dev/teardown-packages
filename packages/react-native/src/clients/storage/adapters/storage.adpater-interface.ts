/**
 * A storage interface that is used to store data.
 */
export type SupportedStorage = {
	preload: () => void | Promise<void>;
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
	keys: () => string[];
};

/**
 * An interface for a storage adapter.
 * This interface is used to abstract the storage adapter implementation.
 */
export abstract class StorageAdapter {
	/**
	 * Creates a storage instance for a given storage key.
	 * @param storageKey - The key to create the storage instance for.
	 * @returns A storage instance.
	 *
	 * We can have multiple storage instances for different purposes. Hence the storage key is used to create the storage instance.
	 */
	abstract createStorage(storageKey: string): SupportedStorage;
}
