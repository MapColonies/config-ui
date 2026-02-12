# Testing Patterns

This guide covers testing setup, structure, and best practices for React components.

## Test Commands

```bash
npm test                       # Run all tests once
npm run test:watch             # Run tests in watch mode
npm run test:ui                # Open Vitest UI
npm run test:coverage          # Generate coverage report

# Run a single test file
npx vitest run src/components/ConfigDataTable.test.tsx

# Run specific test by name pattern
npx vitest run -t "should show loading spinner"
```

## Test File Location

Co-located with components:

- `src/components/ConfigDataTable.test.tsx`
- `src/test/` for integration tests and setup

**Setup File:** `src/test/setup.ts` (imported automatically by Vitest)

## Helper Pattern

```typescript
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading spinner", () => {
      // Test implementation
    });
  });

  describe("User Interactions", () => {
    it("should handle click events", async () => {
      const user = userEvent.setup();
      // Test implementation
    });
  });
});
```

## Mocking API Calls

```typescript
import { $api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  $api: {
    useQuery: vi.fn(),
  },
}));

const mockUseQuery = vi.mocked($api.useQuery);

mockUseQuery.mockReturnValue({
  data: mockData,
  isLoading: false,
  error: null,
} as any);
```

## Best Practices

1. **Test behavior, not implementation** - Focus on user interactions and outcomes
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Avoid implementation details** - Don't test internal state or method calls
4. **Setup user interaction** - Use `userEvent.setup()` for all user interactions
5. **Wait for async updates** - Use `waitFor` for async state changes
6. **Clear mocks between tests** - Use `beforeEach(() => vi.clearAllMocks())`
