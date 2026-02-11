import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useSchemaIndex,
  useSchemaTree,
  useSchemaFull,
  useConfigsBySchema,
} from "./schemaCache";
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

describe("schemaCache hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSchemaIndex", () => {
    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() => useSchemaIndex());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return schema index data when loaded", async () => {
      const mockData: any = {
        schemas: [
          { id: "schema1", name: "Schema 1" },
          { id: "schema2", name: "Schema 2" },
        ],
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() => useSchemaIndex());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call API with correct endpoint", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() => useSchemaIndex());

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/schema/index",
        expect.objectContaining({
          staleTime: 1000 * 60 * 60,
          gcTime: 1000 * 60 * 60 * 24,
          refetchOnWindowFocus: false,
        }),
      );
    });
  });

  describe("useSchemaTree", () => {
    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() => useSchemaTree());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return schema tree data when loaded", async () => {
      const mockData: any = {
        tree: {
          common: {
            db: ["v1", "v2"],
          },
        },
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() => useSchemaTree());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call API with correct endpoint and caching options", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() => useSchemaTree());

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/schema/tree",
        expect.objectContaining({
          staleTime: 1000 * 60 * 60,
          gcTime: 1000 * 60 * 60 * 24,
          refetchOnWindowFocus: false,
        }),
      );
    });
  });

  describe("useSchemaFull", () => {
    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useSchemaFull("https://example.com/schema/v1"),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return full schema data when loaded", async () => {
      const mockData: any = {
        id: "https://example.com/schema/v1",
        raw: {},
        dereferenced: {},
        typescript: "export interface Schema {}",
        dependencies: [],
        envVars: [],
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useSchemaFull("https://example.com/schema/v1"),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
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
        useSchemaFull("https://example.com/schema/v2"),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/schema/full",
        expect.objectContaining({
          params: {
            query: { id: "https://example.com/schema/v2" },
          },
          staleTime: 1000 * 60 * 30,
          gcTime: 1000 * 60 * 60,
          enabled: true,
        }),
      );
    });

    it("should be disabled when schemaId is undefined", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHookWithProviders(() => useSchemaFull(undefined));

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/schema/full",
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it("should use empty string as ID when undefined", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHookWithProviders(() => useSchemaFull(undefined));

      const call = mockUseQuery.mock.calls[0];
      const options: any = call?.[2];
      expect(options?.params?.query?.id).toBe("");
    });
  });

  describe("useConfigsBySchema", () => {
    it("should return loading state initially", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigsBySchema("https://example.com/schema/v1"),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should return configs data when loaded", async () => {
      const mockData: any = {
        configs: [
          { name: "config1", version: 1 },
          { name: "config2", version: 1 },
        ],
        total: 2,
      };

      mockUseQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHookWithProviders(() =>
        useConfigsBySchema("https://example.com/schema/v1"),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
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
        useConfigsBySchema("https://example.com/schema/v1"),
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/config",
        expect.objectContaining({
          params: {
            query: {
              schema_id: "https://example.com/schema/v1",
              limit: 20,
            },
          },
          enabled: true,
        }),
      );
    });

    it("should be disabled when schemaId is undefined", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHookWithProviders(() => useConfigsBySchema(undefined));

      expect(mockUseQuery).toHaveBeenCalledWith(
        "get",
        "/config",
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it("should handle undefined schemaId in query params", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderHookWithProviders(() => useConfigsBySchema(undefined));

      const call = mockUseQuery.mock.calls[0];
      const options: any = call?.[2];
      expect(options?.params?.query?.schema_id).toBeUndefined();
    });

    it("should use limit of 20", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderHookWithProviders(() =>
        useConfigsBySchema("https://example.com/schema"),
      );

      const call = mockUseQuery.mock.calls[0];
      const options: any = call?.[2];
      expect(options?.params?.query?.limit).toBe(20);
    });
  });
});
