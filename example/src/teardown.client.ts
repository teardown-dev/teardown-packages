import {
  HTTPPlugin,
  LoggingPlugin,
  TeardownClient,
} from './packages/react-native/src';

const plugins = [
  ['logging', new LoggingPlugin()],
  [
    'network',
    new HTTPPlugin({
      ignoreURLs: [new RegExp('.*/__css_interop_update_endpoint.*')],
    }),
  ],
] as const;

export const teardownClient = new TeardownClient({
  plugins,
  host: '0.tcp.au.ngrok.io',
  port: 13301,
});
