# @teardown/react-native

React Native SDK for device identity, force updates, logging, and analytics.

## Dev environment tips
- Run `cd packages/react-native` to navigate to package
- Use `bun run dev` for watch mode during development
- Check adapter exports in `src/exports/` for platform-specific code
- Core architecture in `src/teardown.core.ts` - all clients injected via constructor
- Storage namespaced as `teardown:v1:{org}:{project}:{key}`
- Clients follow pattern: logging injected, create logger, use in methods

## Testing instructions
- Run `bun test` from package root to run all tests
- Focus on single test: `bun test src/clients/identity/identity.client.test.ts`
- Mock adapters using in-memory implementations (see `*.test.ts` files)
- Test client initialization order: Storage → Notifications → Identity → ForceUpdate
- Verify adapter interfaces extend abstract base classes correctly
- Run `bun run typecheck` before committing to catch type errors

## Key architecture notes
- **Adapter pattern**: Device, Storage, Notification adapters injected into `TeardownCore`
- **Client initialization order matters**: Device before Events (needs device ID), Notifications before Identity (needs token)
- **Multi-entry exports**: Main (`@teardown/react-native`), adapters (`/adapters/*`), platform bundles (`/expo`, `/firebase`, `/wix`)
- **Event system**: `IdentityClient` emits state changes via EventEmitter3
- **Storage hydration**: All storage calls `preload()`, `whenReady()` waits for all

## Adding adapters
1. Extend abstract base class (`DeviceInfoAdapter`, `StorageAdapter`, `NotificationAdapter`)
2. Implement required methods/getters
3. Add export to `src/exports/adapters/{name}.ts`
4. Update `package.json` exports map
5. Add peer dependencies (mark optional in `peerDependenciesMeta`)

## PR instructions
- Title format: [react-native] <description>
- Run `bun run check` before committing (lint + format)
- Run `bun test` to verify all tests pass
- Update README if adding new adapters or platform support
