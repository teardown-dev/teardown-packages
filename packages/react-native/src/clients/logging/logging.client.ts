export type LogLevel = "none" | "error" | "warn" | "info" | "verbose";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	none: 0,
	error: 1,
	warn: 2,
	info: 3,
	verbose: 4,
};

export type LoggingClientOptions = {
	logLevel?: LogLevel;
};

export class LoggingClient {
	private logLevel: LogLevel;

	constructor(options?: LoggingClientOptions) {
		this.logLevel = options?.logLevel ?? "none";
	}

	setLogLevel(level: LogLevel) {
		this.logLevel = level;
	}

	getLogLevel(): LogLevel {
		return this.logLevel;
	}

	shouldLog(level: LogLevel): boolean {
		return LOG_LEVEL_PRIORITY[this.logLevel] >= LOG_LEVEL_PRIORITY[level];
	}

	createLogger(options: Omit<LoggerOptions, "loggingClient">): Logger {
		return new Logger({
			...options,
			loggingClient: this,
		});
	}
}

/**
 * Configuration options for logger creation
 */
export type LoggerOptions = {
	/** Logger name used in log prefixes */
	name: string;
	/** Reference to parent LoggingClient for log level checks */
	loggingClient: LoggingClient;
};

export class Logger {
	/** Bound console methods to preserve call site */
	private boundConsole = {
		log: console.log.bind(console),
		error: console.error.bind(console),
		debug: console.debug.bind(console),
		warn: console.warn.bind(console),
		trace: console.trace.bind(console),
	};

	constructor(private readonly options: LoggerOptions) { }

	get prefix() {
		return `[Teardown:${this.options.name}]`;
	}

	info(message: string, ...args: unknown[]) {
		if (!this.options.loggingClient.shouldLog("info")) return;
		this.boundConsole.log(`${this.prefix} ${message}`, ...args);
	}

	error(message: string, ...args: unknown[]) {
		if (!this.options.loggingClient.shouldLog("error")) return;
		this.boundConsole.error(`${this.prefix} ${message}`, ...args);
	}

	debug(message: string, ...args: unknown[]) {
		if (!this.options.loggingClient.shouldLog("verbose")) return;
		this.boundConsole.debug(`${this.prefix} ${message}`, ...args);
	}

	warn(message: string, ...args: unknown[]) {
		if (!this.options.loggingClient.shouldLog("warn")) return;
		this.boundConsole.warn(`${this.prefix} ${message}`, ...args);
	}

	trace(message: string, ...args: unknown[]) {
		if (!this.options.loggingClient.shouldLog("verbose")) return;
		this.boundConsole.trace(`${this.prefix} ${message}`, ...args);
	}
}
