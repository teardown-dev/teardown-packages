import { LoggingClient, Logger } from "../logging";

export type UpdateInfo = {
  //TODO: Add update info
}

export type UpdateAvailable = {
  type: "available";
  update: UpdateInfo;
}

export type UpdateChecking = {
  type: "checking";
}

export type UpdateError = {
  type: "error";
  message: string;
  error: Error;
}

export type UpdateNoUpdate = {
  type: "no-update";
}

export type UpdateState = UpdateAvailable | UpdateChecking | UpdateError;

export class UpdateClient {

  private readonly logger: Logger;

  constructor(logging: LoggingClient) {
    this.logger = logging.createLogger({
      name: "UpdateClient",
    });
  }

  private _state: UpdateState = {
    type: "checking",
  };

  get state(): UpdateState {
    return this._state;
  }

  private setState(state: UpdateState) {
    this._state = state;
  }

  async checkForUpdates() {
    this.logger.debug("Checking for updates");
    this.setState({ type: "checking" });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const update: UpdateInfo = {
      //TODO: Add update info
    };

    this.logger.debug("Update available", { update });
    this.setState({
      type: "available",
      update,
    });
  }

}