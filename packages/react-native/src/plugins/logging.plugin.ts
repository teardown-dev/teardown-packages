import type { IPlugin, TeardownClient } from "../teardown.client";

type ConsoleMethods = "log" | "warn" | "error" | "debug" | "info";
const methods: ConsoleMethods[] = ["log", "warn", "error", "debug", "info"];

export class LoggingPlugin implements IPlugin {
	private client: TeardownClient<any> | null = null;
	private originalConsoleMethods: Record<ConsoleMethods, typeof console.log> =
		{} as any;

	private createConsoleProxy(method: ConsoleMethods) {
		const original = console[method];
		return new Proxy(original, {
			apply: (target, thisArg, args) => {
				target.apply(thisArg, args);
				this.client?.debugger?.send("CONSOLE_LOG", {
					type: method,
					args,
				});
			},
		});
	}

	constructor() {
		methods.forEach((method) => {
			this.originalConsoleMethods[method] = console[method];
			console[method] = this.createConsoleProxy(method);
		});
	}

	install(client: TeardownClient<any>): void {
		this.client = client;
	}

	uninstall() {
		methods.forEach((method) => {
			console[method] = this.originalConsoleMethods[method];
		});
	}
}
