# @teardown/react-native

Comprehensive SDK for managing device identity, force updates, logging, and analytics in React Native and Expo applications.

## Features

- 🔐 **Device & User Identity** - Unique device fingerprinting and user session management
- 🔄 **Force Updates** - Automatic version checking with optional or required update flows
- 📱 **Device Information** - Comprehensive device, OS, and app information collection
- 💾 **Storage** - Namespaced persistent storage with platform adapters
- 📝 **Logging** - Structured logging system with debug modes
- ⚡ **Performance** - Optimized with caching, throttling, and efficient state management
- 🎯 **Type Safety** - Full TypeScript support with runtime validation

## Installation

```bash
bun add @teardown/react-native
```

### Peer Dependencies

```bash
bun add react react-native zod
bun add expo-application expo-device expo-updates
bun add react-native-device-info
```

## Quick Start

### 1. Initialize the SDK

```tsx
import { TeardownCore } from '@teardown/react-native';
import { ExpoDeviceAdapter } from '@teardown/react-native/expo';
import { createMMKVStorageFactory } from '@teardown/react-native/mmkv';

export const teardown = new TeardownCore({
  org_id: 'your-org-id',
  project_id: 'your-project-id',
  api_key: 'your-api-key',
  storageFactory: createMMKVStorageFactory(),
  deviceAdapter: new ExpoDeviceAdapter(),
  forceUpdate: {
    throttleMs: 30_000, // 30 seconds
    checkCooldownMs: 10_000, // 10 seconds
  },
});
```

### 2. Wrap your app with TeardownProvider

```tsx
import { TeardownProvider } from '@teardown/react-native';
import { teardown } from './lib/teardown';

export default function RootLayout() {
  return (
    <TeardownProvider core={teardown}>
      <YourApp />
    </TeardownProvider>
  );
}
```

### 3. Use in components

```tsx
import { useTeardown } from '@teardown/react-native';

function YourComponent() {
  const { core } = useTeardown();
  
  const handleLogin = async () => {
    await core.identity.identify({
      user_id: 'user-123',
      email: 'user@example.com',
    });
  };
  
  return <Button onPress={handleLogin} />;
}
```

## Documentation

Complete documentation is available in the [docs](./docs) folder:

- [Getting Started](./docs/01-getting-started.mdx) - Installation and setup
- [Core Concepts](./docs/02-core-concepts.mdx) - Architecture overview
- [Identity & Authentication](./docs/03-identity.mdx) - User session management
- [Force Updates](./docs/04-force-updates.mdx) - Version management
- [Device Information](./docs/05-device-info.mdx) - Device data collection
- [Storage](./docs/06-storage.mdx) - Persistent storage
- [Logging](./docs/07-logging.mdx) - Structured logging
- [API Reference](./docs/08-api-reference.mdx) - Complete API docs
- [Hooks Reference](./docs/09-hooks-reference.mdx) - React hooks
- [Advanced Usage](./docs/10-advanced.mdx) - Advanced patterns

## License

Proprietary - See LICENSE file for details
