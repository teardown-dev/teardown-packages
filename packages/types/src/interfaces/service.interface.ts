export type LoggingContext = Record<string, unknown> | string | number | boolean;

/**
 * Abstract base class for implementing singleton pattern in services with logging.
 *
 * @example
 * ```ts
 * class MyService extends Service {
 *   constructor() {
 *     super('MyService');
 *   }
 *
 *   doSomething() {
 *     this.info('Doing something');
 *     return 'result';
 *   }
 * }
 *
 * // Usage
 * const service = MyService.instance<MyService>();
 * ```
 */
export abstract class Service {
	private static instances: Map<string, unknown> = new Map();
	protected serviceName: string;

	// Logging methods - initialized in constructor to preserve stack traces
	protected debug!: (message: string, context?: LoggingContext) => void;
	protected info!: (message: string, context?: LoggingContext) => void;
	protected warn!: (message: string, context?: LoggingContext) => void;
	protected error!: (message: string, context?: LoggingContext) => void;

	constructor(serviceName?: string) {
		this.serviceName = serviceName || this.constructor.name;

		// Bind logging methods to preserve correct stack traces
		const prefix = `[${this.serviceName}]`;
		this.debug = console.debug.bind(console, prefix);
		this.info = console.info.bind(console, prefix);
		this.warn = console.warn.bind(console, prefix);
		this.error = console.error.bind(console, prefix);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Allow private constructors in singleton pattern
	public static instance<T>(this: any): T {
		// biome-ignore lint/complexity/noThisInStatic: Accessing class name for singleton map
		const className = this.name;

		if (!Service.instances.has(className)) {
			// biome-ignore lint/complexity/noThisInStatic: Creating instance of derived class
			// biome-ignore lint/suspicious/noExplicitAny: Need to bypass constructor visibility
			const instance = new (this as any)();
			Service.instances.set(className, instance);
		}

		return Service.instances.get(className) as T;
	}

	public static clearInstance(className: string): void {
		Service.instances.delete(className);
	}

	public static clearAllInstances(): void {
		Service.instances.clear();
	}
}
