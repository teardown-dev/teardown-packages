# @teardown/react-native

Complete SDK for user identity, session management, force updates, and device analytics in React Native and Expo applications.

## Features

- 🔐 **Identity Management** - Anonymous and authenticated user tracking
- 📱 **Device Information** - Comprehensive device metadata collection
- 🔄 **Force Updates** - Automatic version checking and enforcement
- 💾 **Storage** - Namespaced persistent storage with MMKV support
- 📊 **Logging** - Structured logging with debug mode
- ⚛️ **React Hooks** - First-class React integration

## Installation

```bash
bun add @teardown/react-native
```

### Peer Dependencies

```bash
# For React Native
bun add react-native-device-info react-native-mmkv

# For Expo
bun add expo-application expo-device expo-updates
```

## Quick Start

```typescript
import { TeardownCore, TeardownProvider, ExpoDeviceAdapter } from "@teardown/react-native";
import * as MMKV from "react-native-mmkv";

// 1. Create storage factory
const createStorage = (storageKey: string) => {
  const storage = MMKV.createMMKV({ id: storageKey });
  return {
    preload: () => storage.getAllKeys(),
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.remove(key),
    clear: () => storage.clearAll(),
    keys: () => storage.getAllKeys(),
  };
};

// 2. Initialize Teardown
const teardown = new TeardownCore({
  api: {
    org_id: "your-org-id",
    project_id: "your-project-id",
    api_key: "your-api-key",
    environment_slug: "production",
  },
  storage: { createStorage },
  device: { adapter: new ExpoDeviceAdapter() },
  identity: { identifyOnLoad: true },
});

// 3. Wrap your app
function App() {
  return (
    <TeardownProvider core={teardown}>
      {/* Your app components */}
    </TeardownProvider>
  );
}
```

## Usage

### Identity & Sessions

```typescript
import { useTeardown } from "@teardown/react-native";

function MyComponent() {
  const { core } = useTeardown();

  const handleLogin = async () => {
    const result = await core.identity.identify({
      user_id: "user-123",
      email: "user@example.com",
      name: "John Doe",
    });

    if (result.success) {
      console.log("User identified:", result.data);
    }
  };
}
```

### Force Updates

```typescript
import { useForceUpdate } from "@teardown/react-native";

function App() {
  const { isUpdateRequired, isUpdateAvailable } = useForceUpdate();

  if (isUpdateRequired) {
    return <ForceUpdateScreen />;
  }

  if (isUpdateAvailable) {
    return (
      <>
        <UpdateBanner />
        <MainApp />
      </>
    );
  }

  return <MainApp />;
}
```

## Documentation

Complete documentation is available in the [`docs`](./docs) folder:

- [Getting Started](./docs/01-getting-started.mdx) - Installation and setup
- [Core Concepts](./docs/02-core-concepts.mdx) - Architecture overview
- [Configuration](./docs/03-configuration.mdx) - Configuration reference
- [Identity & Sessions](./docs/04-identity-sessions.mdx) - User management
- [Force Updates](./docs/05-force-updates.mdx) - Version management
- [Storage](./docs/06-storage.mdx) - Persistent storage
- [API Reference](./docs/07-api-reference.mdx) - Complete API docs
- [Hooks Reference](./docs/08-hooks-reference.mdx) - React hooks
- [Examples](./docs/09-examples.mdx) - Practical examples

## Platform Support

- ✅ React Native (iOS/Android)
- ✅ Expo (Managed & Bare workflow)
- ✅ Expo Go (with limitations)

## Requirements

- React Native >= 0.64
- React >= 16.8 (hooks support)
- TypeScript >= 4.5 (recommended)

## License

MIT
