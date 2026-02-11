# TypeScript Conventions

This guide covers TypeScript-specific patterns and type safety rules.

## Configuration

**Strict Mode:** Enabled in `tsconfig.app.json`

All TypeScript strict checks are enforced:

- No implicit `any`
- Strict null checks
- Strict function types
- No unchecked indexed access

## Naming Patterns

### Props Interfaces

```typescript
// Pattern: ComponentNameProps
interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

interface ConfigDataTableProps {
  filters?: ConfigFilters;
  onRowClick?: (config: Config) => void;
}
```

### Local Types

```typescript
// PascalCase for object types
interface User {
  id: string;
  name: string;
  email: string;
}

type ConfigFilters = {
  search?: string;
  status?: "active" | "inactive";
};

// Union types for enums/states
type WizardMode = "create" | "edit" | "rollback";
type Status = "pending" | "success" | "error";
type ID = string | number;
```

## Type vs Interface

**Use `interface` for object shapes:**

```typescript
interface Config {
  name: string;
  version: number;
  data: Record<string, unknown>;
}

// Can be extended
interface ExtendedConfig extends Config {
  metadata: Record<string, string>;
}
```

**Use `type` for:**

```typescript
// Unions
type Status = "pending" | "success" | "error";

// Primitives
type ID = string | number;

// Complex types
type Result<T> = { data: T } | { error: string };

// Utility types
type Optional<T> = { [K in keyof T]?: T[K] };
```

## Type Safety Rules

### NEVER use `any`

```typescript
// ❌ Bad
function processData(data: any) {
  return data.something;
}

// ✅ Good - use unknown for untyped data
function processData(data: unknown) {
  if (typeof data === "object" && data !== null) {
    // Type narrowing required
  }
}

// ✅ Good - use generics
function processData<T>(data: T): T {
  return data;
}
```

### Use `unknown` for dynamic data

```typescript
// When parsing external data
function parseConfig(json: string): unknown {
  return JSON.parse(json);
}

// Then use type guards
const data = parseConfig(jsonString);
if (isValidConfig(data)) {
  // data is now Config type
}
```

### Use `Record<string, unknown>` for dynamic objects

```typescript
// ❌ Bad
const metadata: any = {};

// ✅ Good
const metadata: Record<string, unknown> = {};

// ✅ Better - define shape when possible
interface Metadata {
  createdAt: string;
  updatedBy: string;
  [key: string]: unknown; // Allow additional properties
}
```

### Optional Properties

```typescript
interface Config {
  name: string; // Required
  version: number; // Required
  description?: string; // Optional
  metadata?: Record<string, string>; // Optional
}

// Accessing optional properties
function displayConfig(config: Config) {
  // Use optional chaining
  const desc = config.description ?? "No description";

  // Or check explicitly
  if (config.metadata) {
    console.log(config.metadata.author);
  }
}
```

### Explicit Return Types

```typescript
// ✅ Good - exported functions should have explicit return types
export function getConfigName(config: Config): string {
  return config.name;
}

export function transformData(data: unknown): Config[] {
  // ...
  return configs;
}

// Internal helper functions can infer
function isValidVersion(version: number) {
  return version > 0;
}
```

## Working with OpenAPI Types

```typescript
import type { paths, components } from "@/types/api";

// Extract response types
type ConfigResponse = components["schemas"]["Config"];
type ErrorResponse = components["schemas"]["Error"];

// Extract path parameter types
type GetConfigParams = paths["/config/{name}/{version}"]["get"]["parameters"];

// Use with API client
const { data } = $api.useQuery("get", "/config/{name}/{version}", {
  params: {
    path: { name: "db-config", version: 1 },
  },
});
// data is automatically typed from OpenAPI spec
```

## Type Assertions (Use Sparingly)

```typescript
// ❌ Bad - lying to TypeScript
const config = data as Config; // Unsafe

// ✅ Good - validate first, then assert
if (isValidConfig(data)) {
  const config = data; // Type narrowed, no assertion needed
}

// ⚠️ Acceptable - when you have external guarantee
const element = document.getElementById("root") as HTMLElement;
// Only if you're certain it exists
```

## Utility Types

```typescript
// Make all properties optional
type PartialConfig = Partial<Config>;

// Make all properties required
type RequiredConfig = Required<Config>;

// Pick specific properties
type ConfigIdentifier = Pick<Config, "name" | "version">;

// Omit specific properties
type ConfigWithoutData = Omit<Config, "data">;

// Infer from Valibot schema
import * as v from "valibot";

const schema = v.object({
  name: v.string(),
  version: v.number(),
});

type FormData = v.InferOutput<typeof schema>;
```
