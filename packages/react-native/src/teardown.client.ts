import { Logger } from "@teardown/logger";
import { Debugger, type DebuggerOptions } from "./debugger";

export interface IPlugin {
	install?(client: TeardownClient<any>): void;
	uninstall?(): void;
}

export type DefaultPluginOptions<T> = {
	debug?: boolean;
} & T;

export type PluginOptions<T> = DefaultPluginOptions<{
	key: string;
}> &
	T;

export abstract class Plugin<T = any> {
	protected logger: Logger;

	protected constructor(options: PluginOptions<T>) {
		this.logger = new Logger(options.key, options.debug ?? false);
	}

	install?(client: TeardownClient<any>): void;
	uninstall?(): void;
}

export type PluginTuple = readonly [string, IPlugin];

type InferPluginFromTuple<T extends PluginTuple> = {
	[K in T[0]]: Omit<T[1], "install" | "uninstall">;
};

type InferPluginsFromArray<T extends readonly PluginTuple[]> =
	UnionToIntersection<InferPluginFromTuple<T[number]>>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

export type TeardownClientOptions<T extends readonly PluginTuple[]> = {
	plugins?: T;
	debuggerEnabled?: boolean;
	loggingEnabled?: boolean;
} & DebuggerOptions;

export class TeardownClient<T extends readonly PluginTuple[]> {
	public logger: Logger;
	public debugger: Debugger | null;

	private readonly plugins: Map<string, IPlugin> = new Map();
	public api: InferPluginsFromArray<T> = {} as InferPluginsFromArray<T>;

	constructor(readonly options?: TeardownClientOptions<T>) {
		this.logger = new Logger(
			"TeardownClient",
			options?.loggingEnabled ?? false,
		);
		this.debugger = options?.debuggerEnabled ? new Debugger(options) : null;

		options?.plugins?.forEach(([key, plugin]) => {
			this.plugins.set(key, plugin);
		});

		this.installPlugin();
	}

	private installPlugin() {
		this.logger.log("Installing plugins");
		this.plugins.forEach((plugin, key) => {
			plugin.install?.(this);
			(this.api as any)[key] = plugin;
		});
		this.logger.log("Plugins installed");
	}

	private uninstallPlugin(key: string) {
		const plugin = this.plugins.get(key);
		if (plugin) {
			plugin.uninstall?.();
			this.plugins.delete(key);
			delete (this.api as any)[key];
		}
	}

	private uninstallAllPlugins() {
		this.plugins.forEach((_, key) => this.uninstallPlugin(key));
	}

	private reinstallPlugins() {
		this.uninstallAllPlugins();
		this.installPlugin();
	}

	public shutdown() {
		this.uninstallAllPlugins();
		this.debugger?.shutdown();
	}
}

export const createTeardownClient = <Plugins extends readonly PluginTuple[]>(
	plugins: Plugins,
) => {
	return new TeardownClient({
		loggingEnabled: true,
		debuggerEnabled: true,
		plugins,
	});
};
