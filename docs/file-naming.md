# File Naming Conventions

This guide covers naming patterns for all file types in the project.

## Components

**Pattern:** PascalCase (matching the export name)

```
src/components/
├── ConfigDataTable.tsx
├── LoadingSpinner.tsx
├── SchemaComboBox.tsx
└── WizardNavigation.tsx
```

**Rationale:** Components are React functions exported with PascalCase names, so files should match.

## Test Files

**Pattern:** `ComponentName.test.tsx`

```
src/components/
├── ConfigDataTable.tsx
├── ConfigDataTable.test.tsx      # Co-located with component
├── LoadingSpinner.tsx
└── LoadingSpinner.test.tsx
```

**Integration tests:**

```
src/test/
├── setup.ts
├── integration.test.tsx
└── routing.test.tsx
```

## Route Files

TanStack Router uses special naming conventions:

```
src/routes/
├── __root.tsx           # Root layout (double underscore)
├── index.tsx            # Home route (/)
├── configs.tsx          # /configs
├── configs/
│   ├── index.tsx        # /configs (list view)
│   ├── $name.tsx        # /configs/:name (dynamic segment with $)
│   └── create.tsx       # /configs/create
├── schemas.tsx          # /schemas
├── _layout.tsx          # Layout route (underscore prefix)
└── _authenticated.tsx   # Protected layout
```

**Naming rules:**

- `__root.tsx` - Root layout (double underscore)
- `$paramName.tsx` - Dynamic route segment (dollar sign prefix)
- `_layout.tsx` - Layout route without adding URL segment (underscore prefix)
- `index.tsx` - Index route for parent path
- Regular files use lowercase: `configs.tsx`, `schemas.tsx`, `settings.tsx`

## UI Library Components (shadcn/ui)

**Pattern:** lowercase with hyphens

```
src/components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── table.tsx
└── tabs.tsx
```

**Rationale:** Follows shadcn/ui conventions, distinguishes from custom components.

## Utilities and Libraries

**Pattern:** lowercase (sometimes with hyphens)

```
src/lib/
├── api.ts               # API client setup
├── utils.ts             # Utility functions
├── monaco-config.ts     # Monaco editor config
└── validation.ts        # Custom validators
```

## Stores (Zustand)

**Pattern:** camelCase with "Store" suffix

```
src/stores/
├── wizardStore.ts
├── userPreferencesStore.ts
└── notificationStore.ts
```

**Rationale:** Store files export hooks (`useWizardStore`), camelCase matches hook naming.

## Type Files

**Pattern:** lowercase

```
src/types/
├── api.ts               # Generated from OpenAPI
├── common.ts            # Shared types
└── wizard.ts            # Wizard-specific types
```

## Configuration Files

**Pattern:** Project standard conventions

```
root/
├── vite.config.ts       # Build tool configs use kebab-case
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind config
├── vitest.config.ts     # Test config
└── package.json         # Package metadata
```

## Quick Reference

| Type            | Pattern         | Example                    |
| --------------- | --------------- | -------------------------- |
| Component       | PascalCase      | `ConfigDataTable.tsx`      |
| Test            | `Name.test.tsx` | `ConfigDataTable.test.tsx` |
| Route (regular) | lowercase       | `configs.tsx`              |
| Route (dynamic) | `$param.tsx`    | `$name.tsx`                |
| Route (layout)  | `_name.tsx`     | `_layout.tsx`              |
| Route (root)    | `__root.tsx`    | `__root.tsx`               |
| UI component    | kebab-case      | `dropdown-menu.tsx`        |
| Utility         | lowercase       | `utils.ts`                 |
| Store           | camelCaseStore  | `wizardStore.ts`           |
| Type            | lowercase       | `api.ts`                   |
