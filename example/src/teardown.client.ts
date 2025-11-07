import {
  HTTPPlugin,
  LoggingPlugin,
  TeardownClient,
} from '@teardown/react-native';

const plugins = [
  ['logging', new LoggingPlugin()],
  [
    'network',
    new HTTPPlugin({
      ignoreURLs: ['http://localhost:8081/__css_interop_update_endpoint'],
    }),
  ],
] as const;

export const teardownClient = new TeardownClient({plugins});
