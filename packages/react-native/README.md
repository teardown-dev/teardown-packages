# @teardown/react-native

Comprehensive SDK for managing device identity, force updates, logging, and analytics in React Native and Expo applications.

**[Documentation](https://teardown.dev/docs)** | **[Dashboard](https://dash.teardown.dev)**

## Features

- **Device & User Identity** - Unique device fingerprinting and user session management
- **Force Updates** - Automatic version checking with optional or required update flows
- **Device Information** - Comprehensive device, OS, and app information collection
- **Storage** - Namespaced persistent storage with platform adapters
- **Logging** - Structured logging system with debug modes
- **Performance** - Optimized with caching, throttling, and efficient state management
- **Type Safety** - Full TypeScript support with runtime validation

## Installation

```bash
npm install @teardown/react-native
# or
yarn add @teardown/react-native
# or
bun add @teardown/react-native
```

### Peer Dependencies

Choose adapters based on your project setup:

**Expo projects:**
```bash
npx expo install expo-device expo-application
```

**Bare React Native projects:**
```bash
npm install react-native-device-info
```

**Storage (choose one):**
```bash
# MMKV (recommended - faster)
npm install react-native-mmkv

# or AsyncStorage
npm install @react-native-async-storage/async-storage
```

## Getting Your Credentials

1. Sign up or log in at [dash.teardown.dev](https://dash.teardown.dev)
2. Create or select a project
3. Copy your `org_id`, `project_id`, and `api_key` from project settings

## Quick Start

### 1. Initialize the SDK

Create a file (e.g., `lib/teardown.ts`):

**Expo Setup:**
```tsx
import { TeardownCore } from '@teardown/react-native';
import { ExpoDeviceAdapter } from '@teardown/react-native/adapters/expo';
import { MMKVStorageAdapter } from '@teardown/react-native/adapters/mmkv';

export const teardown = new TeardownCore({
  org_id: 'your-org-id',
  project_id: 'your-project-id',
  api_key: 'your-api-key',
  storageAdapter: new MMKVStorageAdapter(),
  deviceAdapter: new ExpoDeviceAdapter(),
});
```

**Bare React Native Setup:**
```tsx
import { TeardownCore } from '@teardown/react-native';
import { DeviceInfoAdapter } from '@teardown/react-native/adapters/device-info';
import { AsyncStorageAdapter } from '@teardown/react-native/adapters/async-storage';

export const teardown = new TeardownCore({
  org_id: 'your-org-id',
  project_id: 'your-project-id',
  api_key: 'your-api-key',
  storageAdapter: new AsyncStorageAdapter(),
  deviceAdapter: new DeviceInfoAdapter(),
});
```

### 2. Wrap your app with TeardownProvider

```tsx
import { TeardownProvider } from '@teardown/react-native';
import { teardown } from './lib/teardown';

export default function App() {
  return (
    <TeardownProvider core={teardown}>
      <YourApp />
    </TeardownProvider>
  );
}
```

### 3. Use in components

```tsx
import { useTeardown, useForceUpdate, useSession } from '@teardown/react-native';

function YourComponent() {
  const { core } = useTeardown();
  const session = useSession();
  const { versionStatus, isUpdateRequired } = useForceUpdate();

  const handleLogin = async () => {
    await core.identity.identify({
      user_id: 'user-123',
      email: 'user@example.com',
    });
  };

  return <Button onPress={handleLogin} title="Login" />;
}
```

## Configuration Options

```tsx
new TeardownCore({
  org_id: string,               // Your organization ID
  project_id: string,           // Your project ID
  api_key: string,              // Your API key
  environment_slug?: string,    // Environment slug (default: "production")
  ingestUrl?: string,           // Custom ingest API URL (optional)
  storageAdapter: adapter,      // Storage implementation
  deviceAdapter: adapter,       // Device info source
  notificationAdapter?: adapter, // Push notification adapter (optional)
  forceUpdate?: {
    checkIntervalMs?: number,   // Min time between checks (default: 300000ms/5min)
    checkOnForeground?: boolean, // Check on app foreground (default: true)
    identifyAnonymousDevice?: boolean, // Check even when not identified (default: false)
  },
});
```

## Available Adapters

| Adapter | Import Path | Use Case |
|---------|-------------|----------|
| `ExpoDeviceAdapter` | `@teardown/react-native/adapters/expo` | Expo projects |
| `DeviceInfoAdapter` | `@teardown/react-native/adapters/device-info` | Bare RN projects |
| `MMKVStorageAdapter` | `@teardown/react-native/adapters/mmkv` | Fast sync storage |
| `AsyncStorageAdapter` | `@teardown/react-native/adapters/async-storage` | Standard async storage |

## Documentation

For detailed guides, visit **[teardown.dev/docs](https://teardown.dev/docs)**

Local documentation is also available in the [docs](./docs) folder:

- [Getting Started](./docs/getting-started.mdx)
- [Core Concepts](./docs/core-concepts.mdx)
- [Identity & Authentication](./docs/identity.mdx)
- [Force Updates](./docs/force-updates.mdx)
- [Logging](./docs/logging.mdx)
- [API Reference](./docs/api-reference.mdx)
- [Hooks Reference](./docs/hooks-reference.mdx)
- [Advanced Usage](./docs/advanced.mdx)
- [Adapters](./docs/adapters/index.mdx)

## License

Proprietary - See LICENSE file for details
