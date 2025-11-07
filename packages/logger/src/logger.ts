// Global debug state
const isDebug = true; // toggle this to turn on/off for global control

export class Logger {
	private readonly key: string;

	enabled = false;

	log: typeof console.log = () => {};
	error: typeof console.error = () => {};
	warn: typeof console.warn = () => {};
	info: typeof console.info = () => {};
	debug: typeof console.debug = () => {};

	constructor(key: string, enabled = isDebug) {
		this.key = key;
		this.enabled = enabled;

		this.setupLogger();
	}

	// Method to create a proxy for console methods
	private setupLogger() {
		this.log = this.enabled
			? console.log.bind(console, `${this.buildPrefix()} `)
			: () => {};
		this.error = this.enabled
			? console.error.bind(console, `${this.buildPrefix()} `)
			: () => {};
		this.warn = this.enabled
			? console.warn.bind(console, `${this.buildPrefix()} `)
			: () => {};
		this.info = this.enabled
			? console.info.bind(console, `${this.buildPrefix()} `)
			: () => {};
		this.debug = this.enabled
			? console.debug.bind(console, `${this.buildPrefix()} `)
			: () => {};
	}

	enable(enabled = true) {
		this.enabled = enabled;
		this.setupLogger();
	}

	buildPrefix() {
		return `---- ${this.key} ----`;
	}
}
