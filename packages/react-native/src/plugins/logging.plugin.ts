import {Plugin, TeardownClient} from '../teardown.client';

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleDebug = console.debug;
const originalConsoleError = console.error;

export class LoggingPlugin implements Plugin {
  private client: TeardownClient<any> | null = null;

  install(client: TeardownClient<any>): void {
    this.client = client;

    console.log = (...args: Parameters<typeof console.log>) => {
      originalConsoleLog(...args);

      this.client?.debugger?.send('CONSOLE_LOG', {
        type: 'log',
        args,
      });
    };

    console.warn = (...args: Parameters<typeof console.warn>) => {
      originalConsoleWarn(...args);

      this.client?.debugger?.send('CONSOLE_LOG', {
        type: 'warn',
        args,
      });
    };

    console.debug = (...args: Parameters<typeof console.debug>) => {
      originalConsoleDebug(...args);

      this.client?.debugger?.send('CONSOLE_LOG', {
        type: 'debug',
        args,
      });
    };

    console.error = (...args: Parameters<typeof console.error>) => {
      originalConsoleError(...args);

      this.client?.debugger?.send('CONSOLE_LOG', {
        type: 'error',
        args,
      });
    };
  }

  uninstall() {}
}
