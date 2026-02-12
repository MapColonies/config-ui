import createClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths, components } from "@/types/api";
import type { FetchOptions } from "openapi-fetch";
import { parseApiError } from "@/lib/errors/api-errors";
import type { AppError } from "@/lib/errors/types";

// Create the fetch client with the base URL
const fetchClient = createClient<paths>({
  baseUrl: "/api",
});

// Create React Query client from the fetch client
export const $api = createQueryClient(fetchClient);

// Export the fetch client for direct access if needed
export { fetchClient };

/**
 * Utility type to create a config request body (omits readonly server-generated fields)
 * The OpenAPI spec marks createdAt, createdBy, and isLatest as readOnly,
 * meaning they should NOT be sent in POST requests.
 */
export type ConfigCreateRequest = Omit<
  components["schemas"]["config"],
  "createdAt" | "createdBy" | "isLatest"
>;

/**
 * Enhanced API client with automatic error parsing
 * All errors are converted to AppError with user-friendly messages
 */
export const api = {
  /**
   * GET request with automatic error parsing
   */
  async GET<TPath extends keyof paths>(
    url: TPath,
    init?: FetchOptions<paths[TPath]["get"]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ data: any; error: null } | { data: null; error: AppError }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, response } = await fetchClient.GET(url as any, init as any);

    if (error) {
      const appError = parseApiError(error, response, {
        endpoint: url as string,
        method: "GET",
      });
      return { data: null, error: appError };
    }

    return { data, error: null };
  },

  /**
   * POST request with automatic error parsing
   */
  async POST<TPath extends keyof paths>(
    url: TPath,
    init?: FetchOptions<paths[TPath]["post"]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ data: any; error: null } | { data: null; error: AppError }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, response } = await fetchClient.POST(url as any, init as any);

    if (error) {
      const appError = parseApiError(error, response, {
        endpoint: url as string,
        method: "POST",
      });
      return { data: null, error: appError };
    }

    return { data, error: null };
  },
};
