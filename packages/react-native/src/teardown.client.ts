import {Logger} from '@teardown/logger';
import {Debugger} from './debugger';

export interface Plugin {
  install?(client: TeardownClient<any>): void;
  uninstall?(): void;
}

export type PluginTuple = readonly [string, Plugin];

type InferPluginFromTuple<T extends PluginTuple> = {
  [K in T[0]]: Omit<T[1], 'install' | 'uninstall'>;
};

type InferPluginsFromArray<T extends readonly PluginTuple[]> =
  UnionToIntersection<InferPluginFromTuple<T[number]>>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type TeardownClientOptions<T extends readonly PluginTuple[]> = {
  plugins: T;
  debug?: boolean;
};

export class TeardownClient<T extends readonly PluginTuple[]> {
  private logger = new Logger('TeardownClient');

  private readonly plugins: Map<string, Plugin> = new Map();

  public debugger: Debugger;

  public api: InferPluginsFromArray<T> = {} as InferPluginsFromArray<T>;

  constructor(options: TeardownClientOptions<T>) {
    this.debugger = new Debugger();

    options.plugins.forEach(([key, plugin]) => {
      this.plugins.set(key, plugin);
    });

    this.installPlugins();
  }

  private installPlugins() {
    this.logger.log('Installing plugins');
    this.plugins.forEach((plugin, key) => {
      plugin.install?.(this);
      (this.api as any)[key] = plugin;
    });
    this.logger.log('Plugins installed');
  }

  uninstallPlugin(key: string) {
    const plugin = this.plugins.get(key);
    if (plugin) {
      plugin.uninstall?.();
      this.plugins.delete(key);
      delete (this.api as any)[key];
    }
  }

  uninstallAllPlugins() {
    this.plugins.forEach((_, key) => this.uninstallPlugin(key));
  }

  reinstallPlugins() {
    this.uninstallAllPlugins();
    this.installPlugins();
  }
}
