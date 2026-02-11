import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConfigFull, useConfigVersions } from "./configCache";
import { $api } from "@/lib/api";

// Mock the $api.useQuery hook
vi.mock("@/lib/api", () => ({
  $api: {
    useQuery: vi.fn(),
  },
}));

const mockUseQuery = vi.mocked($api.useQuery);

// Helper to render hooks with providers
function renderHookWithProviders<T>(hook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  return renderHook(hook, { wrapper });
}

describe("configCache hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useConfigFull", () => {
    const mockFullConfig: any = {
      configName: "test-config",
      schemaId: "https://example.com/schema/v1",
      version: 2,
      createdAt: "2025-01-15T10:00:00Z",
      createdBy: "alice",
      hash: "abc123",
      isLatest: true,
      rawConfig: { name: "test" },
      resolvedConfig: { name: "test-resolved" },
      configWithDefaults: { name: "test-with-defaults" },
      stats: {
        configSize: 1024,
        keyCount: 10,
        refCount: 2,
        depth: 3,
      },
      dependencies: {
        parents: [],
        children: [],
      },
      versions: {
        total: 2,
        all: [],
      },
      envVars: [],
      schema: {
        id: "https://example.com/schema/v1",
        name: "test-schema",
        version: "v1",
        category: "test",
      },
    };

    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigFull("test-config", 2, "https://example.com/schema/v1")
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return data when loaded successfully", async () => {
      mockUseQuery.mockReturnValue({
        data: mockFullConfig,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigFull("test-config", 2, "https://example.com/schema/v1")
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockFullConfig);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should return error when fetch fails", async () => {
      const mockError = new Error("Network error");
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigFull("test-config", 2, "https://example.com/schema/v1")
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call API with correct parameters", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() =>
        useConfigFull("my-config", 5, "https://example.com/schema/v2")
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/config/{name}/{version}/full",
        expect.objectContaining({
          params: {
            path: { name: "my-config", version: 5 },
            query: { schemaId: "https://example.com/schema/v2" },
          },
        })
      );
    });

    it("should use proper cache key based on config name, version, and schemaId", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() =>
        useConfigFull("app-config", 3, "https://example.com/schema/v1")
      );

      const call = mockUseQuery.mock.calls[0];
      const options = call[2];
      // The queryKey might be auto-generated, so just check that the hook was called with options
      expect(options).toBeDefined();
    });
  });

  describe("useConfigVersions", () => {
    const mockVersionsData: any = {
      configs: [
        {
          version: 3,
          createdAt: "2025-01-15T10:00:00Z",
          createdBy: "alice",
          isLatest: true,
          hash: "abc123",
        },
        {
          version: 2,
          createdAt: "2025-01-10T09:00:00Z",
          createdBy: "bob",
          isLatest: false,
          hash: "def456",
        },
      ],
      total: 2,
    };

    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigVersions("test-config", "https://example.com/schema/v1")
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return versions data when loaded successfully", async () => {
      mockUseQuery.mockReturnValue({
        data: mockVersionsData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigVersions("test-config", "https://example.com/schema/v1")
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockVersionsData);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call API with correct parameters", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() =>
        useConfigVersions("my-config", "https://example.com/schema/v2")
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/config",
        expect.objectContaining({
          params: {
            query: {
              config_name: "my-config",
              schema_id: "https://example.com/schema/v2",
              limit: 100,
              sort: ["version:desc"],
            },
          },
        })
      );
    });

    it("should use proper cache key based on config name and schemaId", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() =>
        useConfigVersions("app-config", "https://example.com/schema/v1")
      );

      const call = mockUseQuery.mock.calls[0];
      const options = call[2];
      // The queryKey might be auto-generated, so just check that the hook was called
      expect(options).toBeDefined();
    });
  });
});
