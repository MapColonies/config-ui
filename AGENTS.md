# Agent Development Guide

React 19 + TypeScript configuration management UI with type-safe OpenAPI integration.

## Essential Commands

```bash
npm run dev                    # Start dev server (http://localhost:5173)
npm run build                  # Type check + production build
npm test                       # Run tests
npm run types:generate         # Regenerate types from openapi3.yaml
```

## Critical Project-Specific Information

**Type-Safe API Client Pattern:**

```typescript
// All API calls use the $api client from lib/api.ts
import { $api } from "@/lib/api";

const { data, isLoading, error } = $api.useQuery(
  "get",
  "/config/{name}/{version}",
  {
    params: { path: { name: "db-config", version: 1 } },
  },
);
```

**Path Alias:** Always use `@/` for imports (maps to `src/`)

**API Proxy:** Dev server proxies `/api` → `http://localhost:8080` (see vite.config.ts)

**Monaco Editor:** Requires special bundling for web workers in air-gapped deployments. Test early!

**After OpenAPI spec changes:** Run `npm run types:generate` to regenerate TypeScript types

## Technology Stack

**Core:** React 19 + TypeScript + Vite  
**Routing:** TanStack Router (file-based, type-safe)  
**State:** TanStack Query (server), Zustand (client/wizard flows)  
**UI:** Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react icons  
**Forms:** react-hook-form + Valibot validation  
**API:** openapi-typescript + openapi-fetch + openapi-react-query  
**Testing:** Vitest + @testing-library/react + jsdom

## Project-Specific Conventions

**State Management Strategy:**

- TanStack Query for server state (configs, schemas, API data)
- Zustand for complex client state (wizard flow)
- `useState` for local component state

**Performance:** Use `useMemo`/`useCallback` only for expensive computations (loops, complex calculations), not simple operations

**UI Components:** Prefer shadcn/ui components - don't reinvent existing UI

**Data Validation:** Use Valibot for forms, type guards for API responses

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Detailed Guides

When working on specific tasks, reference these guides:

- **[Code Style & Component Patterns](docs/code-style.md)** - Import organization, component structure, error handling
- **[TypeScript Conventions](docs/typescript.md)** - Type safety rules, naming patterns
- **[File Naming](docs/file-naming.md)** - Naming conventions for components, routes, tests
- **[Testing Patterns](docs/testing.md)** - Test structure, mocking, best practices
- **[Common Patterns](docs/component-patterns.md)** - Recursive helpers, utilities, examples

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (button, card, etc.)
│   ├── wizard/          # Wizard-specific components
│   └── [Components].tsx # Reusable components (PascalCase)
├── lib/
│   ├── api.ts           # API client ($api setup)
│   ├── utils.ts         # Utility functions (cn, etc.)
│   └── monaco-config.ts # Monaco editor configuration
├── routes/
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home route
│   ├── configs/         # Nested config routes
│   ├── schemas/         # Nested schema routes
│   └── [routes].tsx     # Other routes
├── stores/
│   └── wizardStore.ts   # Zustand stores
├── types/
│   └── api.ts           # Generated from openapi3.yaml
├── test/
│   ├── setup.ts         # Vitest setup
│   └── *.test.tsx       # Integration tests
├── main.tsx             # App entry point
└── index.css            # Global styles
```

## Quick Reference

**Run specific test file:**

```bash
npx vitest run src/components/ConfigDataTable.test.tsx
```

**Run test by name pattern:**

```bash
npx vitest run -t "should show loading spinner"
```

## Resources

- [React 19 docs](https://react.dev)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Valibot](https://valibot.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
