import {Plugin, TeardownClient} from '../teardown.client';

export class Logging implements Plugin {
  install(client: TeardownClient): void {
    const originalConsoleLog = console.log;
    console.log = (...args: Parameters<typeof console.log>) => {
      originalConsoleLog(...args);

      client.debugger?.send('CONSOLE_LOG', {
        type: 'log',
        args,
      });
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args: Parameters<typeof console.warn>) => {
      originalConsoleWarn(...args);

      client.debugger?.send('CONSOLE_LOG', {
        type: 'warn',
        args,
      });
    };

    const originalConsoleDebug = console.debug;
    console.debug = (...args: Parameters<typeof console.debug>) => {
      originalConsoleDebug(...args);

      client.debugger?.send('CONSOLE_LOG', {
        type: 'debug',
        args,
      });
    };
  }
}
