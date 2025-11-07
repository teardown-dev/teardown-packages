import {Plugin, TeardownClient} from '../teardown.client';

export class LoggingPlugin implements Plugin {
  private client: TeardownClient<any> | null = null;

  install(client: TeardownClient<any>): void {
    this.client = client;

    const originalConsoleLog = console.log;
    console.log = (...args: Parameters<typeof console.log>) => {
      originalConsoleLog(...args);

      this.client?.debugger.send('CONSOLE_LOG', {
        type: 'log',
        args,
      });
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args: Parameters<typeof console.warn>) => {
      originalConsoleWarn(...args);

      this.client?.debugger.send('CONSOLE_LOG', {
        type: 'warn',
        args,
      });
    };

    const originalConsoleDebug = console.debug;
    console.debug = (...args: Parameters<typeof console.debug>) => {
      originalConsoleDebug(...args);

      this.client?.debugger.send('CONSOLE_LOG', {
        type: 'debug',
        args,
      });
    };
  }

  uninstall() {}
}
