
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

### Module Organization & Layout

All related code for a feature or domain is organized into self-contained modules within a central `/modules` directory. Each module encapsulates its functionality and exposes only necessary exports through a root `index.ts` file.

#### Module Locations by Project

- **Backend API**: `packages/api/src/server/modules/`
- **Frontend App**: `apps/app/src/modules/`
- **SDK**: `packages/sdk/src/modules/`

#### Backend API Module Structure

Each backend module follows a strict layered architecture with clearly separated concerns:

```
packages/api/src/server/modules/{module-name}/
├── api/                           # External API integrations (internal to module)
│   ├── {module-name}.api.ts
│   ├── {module-name}.client.ts
│   └── {specific-feature}.api.ts
├── controllers/                   # HTTP endpoints
│   └── {module-name}.controller.ts
├── services/                      # Business logic (exposed between modules)
│   ├── {module-name}.service.ts
│   └── {module-name}-config.service.ts
├── models/                        # Data structures and types
│   ├── {model-name}.model.ts
│   └── index.ts                   # Re-exports all models
├── utils/                         # Module-specific utilities (optional)
│   └── {utility-name}.util.ts
└── index.ts                       # Exports all public APIs
```

**Example**: `packages/api/src/server/modules/vercel/`

```
vercel/
├── api/
│   ├── vercel.api.ts
│   ├── vercel-builds.api.ts
│   ├── vercel-domains.api.ts
│   └── vercel-workflows.api.ts
├── services/
│   ├── vercel-builds.service.ts
│   ├── vercel-domains.service.ts
│   └── vercel-workflows.service.ts
├── models/
│   ├── vercel-build.model.ts
│   ├── vercel-workflow-run.model.ts
│   └── index.ts
├── vercel.models.ts
├── vercel.service.ts
└── index.ts
```

#### Frontend App Module Structure

Frontend modules organize components, routes, and UI logic by feature:

```
apps/app/src/modules/{module-name}/
├── components/                    # Feature components
│   ├── {component-name}.tsx
│   ├── {component-name}.form.tsx
│   ├── {component-name}.dialog.tsx
│   ├── {component-name}.card.tsx
│   ├── {component-name}.button.tsx
│   ├── {component-name}.selector.tsx
│   ├── {component-name}.badge.tsx
│   ├── {component-name}.table.tsx
│   └── {subfolder}/              # Grouped components (optional)
│       ├── {specific}.tsx
│       └── index.ts
├── routes/                        # Route components
│   ├── {route-name}.route.tsx
│   └── {layout}.route.tsx
├── dialogs/                       # Dialog/modal components
│   ├── {dialog-name}.dialog.tsx
│   └── content/
│       └── {dialog-name}.dialog-content.tsx
├── hooks/                         # Custom React hooks
│   └── use-{hook-name}.ts
├── containers/                    # Container components (optional)
│   └── {name}.container.tsx
├── types/                         # TypeScript types (optional)
│   └── index.ts
└── index.ts                       # Exports public components/hooks
```

**Example**: `apps/app/src/modules/releases/`

```
releases/
├── components/
│   ├── builds-table/
│   │   ├── builds-table.tsx
│   │   ├── columns.tsx
│   │   ├── row-actions.tsx
│   │   └── index.ts
│   ├── forms/
│   │   ├── build-tracking-config.form.tsx
│   │   ├── workflow-config.form.tsx
│   │   └── release-config.form.tsx
│   ├── cards/
│   │   ├── release-config.card.tsx
│   │   └── workflow-config.card.tsx
│   ├── build-status.badge.tsx
│   ├── build-item.tsx
│   └── release-detail-table.tsx
├── routes/
│   ├── releases-overview.route.tsx
│   ├── releases-layout.route.tsx
│   └── version-overview.route.tsx
└── dialogs/
    └── add-source-info.dialog.tsx
```

#### SDK Module Structure

SDK modules provide a unified interface for data access and business logic:

```
packages/sdk/src/modules/{module-name}/
├── {module-name}.service.ts       # Main module interface
├── {module-name}.api.ts           # API client methods
├── {module-name}.queries.ts       # React Query hooks
├── {module-name}.mutations.ts     # React Query mutations
├── {module-name}.types.ts         # TypeScript interfaces (optional)
└── index.ts                       # Exports the service
```

**Example**: `packages/sdk/src/modules/releases/`

```
releases/
├── releases.service.ts
├── releases.api.ts
├── releases.queries.ts
├── releases.mutations.ts
└── index.ts
```

#### Module Export Pattern

Every module **MUST** have an `index.ts` file that exports all public APIs. This creates a clean import boundary and makes it easy to refactor internal structure.

**Backend API `index.ts`:**

```typescript
export * from "./controllers/insights.controller";
export * from "./services/insights.service";
export * from "./api/insights.api";
export * from "./models";
```

**Frontend App `index.ts`:**

```typescript
export { AppGuardDashboard } from "./components/app-guard-dashboard";
export { AppGuardRulesList } from "./components/app-guard-rules-list";
export { AppGuardRuleForm } from "./components/app-guard-rule-form";
export { AppGuardAnalytics } from "./components/app-guard-analytics";
export * from "./hooks/use-app-guard";
```

**SDK `index.ts`:**

```typescript
export { ReleasesService } from "./releases.service";
```

#### Import Patterns & Path Aliases

**TypeScript Path Configuration:**

- `@/*` - Maps to `./src/*` for internal imports
- `@core/*` - Maps to `./src/core/*` (app only)
- `@teardown/jobs` - Cross-package reference (API only)
- `@teardown/emails` - Cross-package reference (API only)

**Import Rules:**

1. **Always import from module root** through `index.ts`:

   ```typescript
   // ✅ CORRECT
   import { AppGuardDashboard } from "@/modules/app-guard";
   import { BuildsTable } from "@/modules/releases";

   // ❌ INCORRECT - bypasses module boundary
   import { AppGuardDashboard } from "@/modules/app-guard/components/app-guard-dashboard";
   import { BuildsTable } from "@/modules/releases/components/builds-table/builds-table";
   ```

2. **Use `@/` path alias for all internal imports**:

   ```typescript
   // ✅ CORRECT
   import { Button } from "@/components/ui/button";
   import { BuildMetricsCards } from "@/modules/releases";
   import { core } from "@/core";

   // ❌ INCORRECT - relative paths
   import { Button } from "../../../components/ui/button";
   import { BuildMetricsCards } from "../../releases";
   ```

3. **Module internal imports** can reference sibling files directly:

   ```typescript
   // Within the same module, you can import directly
   // apps/app/src/modules/releases/components/builds-table/columns.tsx
   import { BuildItem } from "../build-item";
   ```

#### Module Naming Conventions

- Use **kebab-case** for module directory names: `app-guard`, `deep-links`, `bitrise-config`
- Use **singular** for domain modules: `project`, `auth`, `user`
- Use **plural** for collection modules: `releases`, `builds`, `insights`
- Module names should be **descriptive** and reflect the domain or feature

#### Module Organization Benefits

1. **Encapsulation** - All related code lives in one place
2. **Clear boundaries** - `index.ts` defines the public API
3. **Easy refactoring** - Internal structure can change without affecting imports
4. **Discoverability** - Features are easy to find in the `modules/` directory
5. **Scalability** - Add new modules without affecting existing ones
6. **Consistent structure** - Same pattern across backend, frontend, and SDK

### File Naming Conventions

All files must use **kebab-case** naming with descriptive suffixes that indicate their type or purpose. Multi-word module names should use kebab-case (e.g., `deep-links`, `bitrise-config`).

#### Backend API (packages/api)

- `*.controller.ts` - HTTP endpoint controllers (e.g., `releases.controller.ts`)
- `*.service.ts` - Business logic services (e.g., `releases.service.ts`, `releases-config.service.ts`)
- `*.api.ts` - External API integrations (e.g., `releases.api.ts`, `github.api.ts`)
- `*.model.ts` - Data models and type definitions (e.g., `release.model.ts`)
- `*.util.ts` - Utility functions (e.g., `admin-config.util.ts`)
- `*.client.ts` - API client implementations (e.g., `bitrise.client.ts`)

#### Frontend App (apps/app)

- `*.tsx` - React components (default for most components)
- `*.route.tsx` - Route components (e.g., `releases-overview.route.tsx`)
- `*.container.tsx` - Container/data-loading components (e.g., `project.container.tsx`)
- `*.hook.ts` - Custom React hooks (e.g., `use-insight-types.ts`)
- `*.form.tsx` - Form components (e.g., `build-tracking-config.form.tsx`)
- `*.dialog.tsx` - Dialog/modal components (e.g., `add-source-info.dialog.tsx`)
- `*.card.tsx` - Card components (e.g., `release-config.card.tsx`)
- `*.button.tsx` - Button components (e.g., `new-version.button.tsx`)
- `*.selector.tsx` - Selector/picker components (e.g., `branch.selector.tsx`)
- `*.badge.tsx` - Badge components (e.g., `release-status.badge.tsx`)
- `*.table.tsx` - Table components (e.g., `domains.table.tsx`)

#### SDK (packages/sdk)

- `*.service.ts` - Module service interfaces (e.g., `releases.service.ts`)
- `*.api.ts` - API client methods (e.g., `releases.api.ts`)
- `*.queries.ts` - React Query hooks (e.g., `releases.queries.ts`)
- `*.mutations.ts` - React Query mutations (e.g., `releases.mutations.ts`)
- `*.types.ts` - TypeScript type definitions (e.g., `releases.types.ts`)

#### Examples

```
✅ CORRECT:
- deep-links.controller.ts
- bitrise-config.service.ts
- release-status.badge.tsx
- use-insight-types.ts
- build-tracking-config.form.tsx

❌ INCORRECT:
- DeepLinksController.ts (PascalCase)
- bitriseConfigService.ts (camelCase)
- ReleaseStatusBadge.tsx (PascalCase)
- useInsightTypes.ts (camelCase)
- BuildTrackingConfigForm.tsx (PascalCase)
```
