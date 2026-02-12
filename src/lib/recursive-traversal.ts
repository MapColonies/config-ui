/**
 * Generic recursive object traversal utility
 * Walks through nested objects and arrays, calling a callback for each value found
 */

export type TraversalCallback<T> = (value: unknown, path: string) => T | null;

/**
 * Recursively traverses an object/array and collects results from callback function
 * @param obj - The object to traverse
 * @param callback - Function called for each value, return null to skip
 * @param path - Current path in dot notation (used internally for recursion)
 * @param results - Accumulated results (used internally for recursion)
 * @returns Array of non-null results from callback
 */
export function traverseObject<T>(
  obj: unknown,
  callback: TraversalCallback<T>,
  path = "",
  results: T[] = [],
): T[] {
  // Process current value (including primitives)
  const result = callback(obj, path);
  if (result !== null) {
    results.push(result);
  }

  // Only recurse into objects and arrays
  if (typeof obj !== "object" || obj === null) {
    return results;
  }

  // Recurse into nested properties
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      traverseObject(item, callback, itemPath, results);
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const nestedPath = path ? `${path}.${key}` : key;
      traverseObject(value, callback, nestedPath, results);
    }
  }

  return results;
}

/**
 * Extract all string values matching a pattern from nested object
 * @param obj - Object to search
 * @param predicate - Function to test each string value
 * @returns Array of matching strings with their paths
 */
export function extractMatchingStrings(
  obj: unknown,
  predicate: (value: string) => boolean,
): Array<{ value: string; path: string }> {
  return traverseObject(obj, (value, path) => {
    if (typeof value === "string" && predicate(value)) {
      return { value, path };
    }
    return null;
  });
}
