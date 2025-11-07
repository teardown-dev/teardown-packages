export class Logger {
  key: string;

  private readonly enabled = true;

  constructor(key: string) {
    this.key = key;
  }

  prefix() {
    return `[Teardown Navigate] - ${this.key} --`;
  }

  log(...args: any[]) {
    this.enabled && console.log(this.prefix(), ...args);
  }

  error(...args: any[]) {
    this.enabled && console.error(this.prefix(), ...args);
  }

  warn(...args: any[]) {
    this.enabled && console.warn(this.prefix(), ...args);
  }

  info(...args: any[]) {
    this.enabled && console.info(this.prefix(), ...args);
  }

  debug(...args: any[]) {
    this.enabled && console.debug(this.prefix(), ...args);
  }
}
