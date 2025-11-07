import {TeardownClient} from './packages/react-native';
import {Logging} from './packages/react-native/services/logging.ts';
import {NetworkingPlugin} from './packages/react-native/services/networking.ts';

export const teardownClient = new TeardownClient({
  debugger: {
    host: '192.168.30.37',
  },
  plugins: [new Logging(), new NetworkingPlugin()],
});
