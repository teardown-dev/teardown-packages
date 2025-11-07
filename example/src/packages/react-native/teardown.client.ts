import {Debugger, DebuggerOptions} from './services';
import {Logger} from '@teardown/logger';

export type TeardownClientOptions = {
  debugger: DebuggerOptions;
  plugins?: Plugin[];
};

export class TeardownClient {
  logger = new Logger('TeardownClient');
  debugger: Debugger | null;

  private plugins: Plugin[] = [];

  constructor(options: TeardownClientOptions) {
    this.debugger = __DEV__ ? new Debugger(options.debugger) : null;

    this.plugins = options.plugins || [];
    this.installPlugins();
  }

  installPlugins() {
    this.logger.log('Installing plugins', this.plugins);
    this.plugins.forEach(plugin => plugin.install(this));
    this.logger.log('Plugins installed');
  }
}

export interface Plugin {
  install(client: TeardownClient): void;
}
