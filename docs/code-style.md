# Code Style & Component Patterns

This guide covers code organization, component structure, and styling conventions.

## Import Organization

Organize imports with blank lines between groups:

```typescript
// 1. External libraries (React, third-party)
import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";

// 2. Icons
import { Eye, Plus, MoreVertical } from "lucide-react";

// 3. UI components (@/components/ui/)
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell } from "@/components/ui/table";

// 4. Custom components
import { LoadingSpinner } from "@/components/LoadingSpinner";

// 5. Utilities, APIs, types, stores
import { $api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ConfigFilters } from "@/types/api";
```

## Component Structure

```typescript
// 1. Type/Interface definitions first
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// 2. Helper functions (outside component)
function extractReferences(obj: unknown): string[] {
  // ...
}

// 3. Main component export
export function ComponentName({ value, onChange }: ComponentProps) {
  // 4. Hooks first (useState, useEffect, custom hooks)
  const [state, setState] = useState("");
  const { data, isLoading, error } = $api.useQuery(...);
  const navigate = useNavigate();

  // 5. Derived values (useMemo, useCallback) - only for expensive operations
  const computedValue = useMemo(() => {
    // Use only when computation is expensive:
    // - Loops over large datasets
    // - Complex calculations
    // - Deep object transformations
    return expensiveComputation(data);
  }, [data]);

  // 6. Event handlers
  const handleClick = () => {
    // ...
  };

  // 7. Early returns for loading/error states
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-destructive font-medium">Error loading data</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // 8. Main JSX return
  return (
    <div className="flex flex-col gap-4">
      {/* Component content */}
    </div>
  );
}
```

## Error Handling Patterns

### API Queries

```typescript
const { data, isLoading, error } = $api.useQuery(...);

if (isLoading) {
  return <LoadingSpinner message="Loading configurations..." />;
}

if (error) {
  return (
    <div className="border rounded-lg p-8 text-center">
      <p className="text-destructive font-medium">Failed to load</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  );
}

// Empty state
if (data.length === 0) {
  return (
    <div className="border rounded-lg p-12 text-center">
      <p className="text-muted-foreground text-sm">No data found</p>
    </div>
  );
}
```

### Parsing with try-catch

```typescript
try {
  const parsed = JSON.parse(data);
  // Use parsed data
} catch (e) {
  console.error("Failed to parse data", e);
  // Handle error
}
```

## Styling with Tailwind

### Utility-first approach

```typescript
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-6">
  <Button className="w-full md:w-auto">Action</Button>
</div>
```

### Use `cn()` utility for conditional classes

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### Design tokens

- Colors: `bg-primary`, `text-muted-foreground`, `text-destructive`
- Spacing: `p-4`, `px-6`, `py-8`, `gap-2`, `space-y-4`
- Responsive: `md:flex-row`, `lg:grid-cols-3`
