# Common Patterns

This guide covers frequently used React patterns and utilities in the project.

## Recursive Helper Functions

When working with nested objects (schemas, configurations):

```typescript
function extractFromNested(
  obj: unknown,
  path: string = "",
  results: Result[] = [],
): Result[] {
  // Type checking
  if (typeof obj !== "object" || obj === null) return results;

  // Process current node
  // ...

  // Recurse into nested properties
  for (const [key, value] of Object.entries(obj)) {
    extractFromNested(value, `${path}.${key}`, results);
  }

  return results;
}
```

**Key points:**

- Always type-check before processing (`typeof obj !== "object" || obj === null`)
- Use `unknown` for input type when dealing with dynamic data
- Build path strings for nested references (`${path}.${key}`)
- Accumulate results in an array parameter

## CSS Utility Function

The `cn()` utility is used throughout the project for conditional class merging:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**

```typescript
import { cn } from "@/lib/utils";

// Conditional classes
<div className={cn(
  "base-class another-class",
  condition && "conditional-class",
  anotherCondition ? "true-class" : "false-class"
)}>

// Override classes (twMerge handles conflicts)
<Button className={cn("px-4 py-2", customPadding && "px-8")} />
```

## State Management Patterns

### Server State (TanStack Query)

Use for API data - configs, schemas, server responses:

```typescript
const { data, isLoading, error } = $api.useQuery(
  "get",
  "/config/{name}/{version}",
  {
    params: { path: { name: configName, version: 1 } },
  },
);
```

### Complex Client State (Zustand)

Use for multi-step flows like wizards:

```typescript
// stores/wizardStore.ts
import { create } from "zustand";

interface WizardStore {
  step: number;
  data: Record<string, unknown>;
  setStep: (step: number) => void;
  setData: (data: Record<string, unknown>) => void;
}

export const useWizardStore = create<WizardStore>((set) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  setData: (data) => set({ data }),
}));
```

### Local Component State (useState)

Use for simple UI state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
```

## Form Patterns

### react-hook-form + Valibot

```typescript
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  version: v.pipe(v.number(), v.minValue(1)),
});

type FormData = v.InferOutput<typeof schema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: valibotResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

## Type Guards for Runtime Validation

When dealing with external data that might not match types:

```typescript
function isValidConfig(data: unknown): data is Config {
  return (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    typeof data.name === "string" &&
    "version" in data &&
    typeof data.version === "number"
  );
}

// Usage
if (isValidConfig(externalData)) {
  // TypeScript knows externalData is Config here
  console.log(externalData.name);
}
```
