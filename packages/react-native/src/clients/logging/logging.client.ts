export class LoggingClient {
	/** Global debug mode state */
	private debugEnabled = false;

	/**
	 * Create a named logger instance with optional debug mode.
	 *
	 * @param options - Logger configuration options
	 * @returns Configured logger instance
	 */
	createLogger(options: LoggerOptions): Logger {
		return new Logger({
			...options,
			debugEnabled: options.debugEnabled ?? this.debugEnabled,
		});
	}
}

/**
 * Configuration options for logger creation
 */
export type LoggerOptions = {
	/** Logger name used in log prefixes */
	name: string;
	/** Enable debug-level logging */
	debugEnabled?: boolean;
};

export class Logger {
	/** Debug mode state for this logger */
	private debugEnabled = false;

	/** Bound console methods to preserve call site */
	private boundConsole = {
		log: console.log.bind(console),
		error: console.error.bind(console),
		debug: console.debug.bind(console),
		warn: console.warn.bind(console),
		trace: console.trace.bind(console),
	};

	/**
	 * Initialize logger with configuration options.
	 *
	 * @param options - Logger configuration
	 */
	constructor(private readonly options: LoggerOptions) {}

	/**
	 * Enable or disable debug logging for this logger.
	 *
	 * @param debugEnabled - Whether to enable debug logs
	 */
	setDebugEnabled(debugEnabled: boolean) {
		this.debugEnabled = debugEnabled;
	}

	/**
	 * Check if debug logging is enabled.
	 *
	 * @returns True if debug logging is enabled
	 */
	isDebugEnabled() {
		return this.debugEnabled;
	}

	get prefix() {
		return `[${this.options.name}]`;
	}

	/**
	 * Log informational message.
	 *
	 * @param message - Log message
	 * @param args - Additional arguments to log
	 */
	info(message: string, ...args: unknown[]) {
		this.boundConsole.log(`${this.prefix} ${message}`, ...args);
	}

	/**
	 * Log error message.
	 *
	 * @param message - Error message
	 * @param args - Additional arguments (e.g., error objects)
	 */
	error(message: string, ...args: unknown[]) {
		this.boundConsole.error(`${this.prefix} ${message}`, ...args);
	}

	/**
	 * Log debug message. Only outputs if debug mode is enabled.
	 *
	 * @param message - Debug message
	 * @param args - Additional debug information
	 */
	debug(message: string, ...args: unknown[]) {
		if (!this.debugEnabled) {
			return;
		}

		this.boundConsole.debug(`${this.prefix} ${message}`, ...args);
	}

	/**
	 * Log warning message.
	 *
	 * @param message - Warning message
	 * @param args - Additional warning context
	 */
	warn(message: string, ...args: unknown[]) {
		this.boundConsole.warn(`${this.prefix} ${message}`, ...args);
	}

	/**
	 * Log trace message with stack trace.
	 *
	 * @param message - Trace message
	 * @param args - Additional trace information
	 */
	trace(message: string, ...args: unknown[]) {
		this.boundConsole.trace(`${this.prefix} ${message}`, ...args);
	}
}
