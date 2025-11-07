import type { Logger, LoggingClient } from "../logging";
import type { StorageClient, SupportedStorage } from "../storage";
import { UtilsClient } from "../utils";


export type IdentifyClientOptions = {
  storage: StorageClient;
};


export class IdentifyClient {

  public readonly logger: Logger;
  public readonly utils: UtilsClient;
  public readonly storage: SupportedStorage;

  constructor(logging: LoggingClient, utils: UtilsClient, storage: StorageClient, _options: IdentifyClientOptions) {
    this.logger = logging.createLogger({
      name: "IdentifyClient",
    });
    this.storage = storage.createStorage("identify");
    this.utils = utils;
  }

}