

export class Logger {
  private static DEFAULT_PREFIX = 'Teardown';
  private readonly prefix: string;
  private readonly key: string;

  private readonly enabled = true;

  constructor(key: string, prefix?: string) {
    this.key = key;
    this.prefix = prefix || Logger.DEFAULT_PREFIX;
  }

  buildPrefix() {
    return `---- [${this.prefix}] ---- ${this.key} ---- `;
  }

  log(...args: any[]) {
    this.enabled && console.log(this.buildPrefix(), ...args);
  }

  error(...args: any[]) {
    this.enabled && console.error(this.buildPrefix(), ...args);
  }

  warn(...args: any[]) {
    this.enabled && console.warn(this.buildPrefix(), ...args);
  }

  info(...args: any[]) {
    this.enabled && console.info(this.buildPrefix(), ...args);
  }

  debug(...args: any[]) {
    this.enabled && console.debug(this.buildPrefix(), ...args);
  }
}
