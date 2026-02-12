/**
 * Config resolution and validation utilities
 * Handles $ref resolution and schema validation for config wizard
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";

export interface ConfigRef {
  configName: string;
  version: string | number;
  schemaId: string;
}

export interface ResolutionError {
  type: "missing-ref" | "circular-ref" | "invalid-ref" | "fetch-error";
  message: string;
  ref?: ConfigRef;
  path?: string;
}

export interface ValidationError {
  type: "structure" | "schema" | "resolution";
  message: string;
  path?: string;
  severity: "error" | "warning";
}

export type FetchConfigFn = (
  ref: ConfigRef
) => Promise<{ config: unknown } | null>;

/**
 * Type guard to check if an object is a valid ConfigRef
 */
export function isValidRef(ref: unknown): ref is ConfigRef {
  if (!ref || typeof ref !== "object") return false;
  if (Array.isArray(ref)) return false;

  const r = ref as Record<string, unknown>;
  return (
    "configName" in r &&
    typeof r.configName === "string" &&
    "version" in r &&
    (typeof r.version === "string" || typeof r.version === "number") &&
    "schemaId" in r &&
    typeof r.schemaId === "string"
  );
}

/**
 * Extract all $ref objects from a config with their paths
 */
export function extractAllRefs(
  obj: unknown,
  path = ""
): Array<{ ref: ConfigRef; path: string }> {
  const refs: Array<{ ref: ConfigRef; path: string }> = [];

  if (!obj || typeof obj !== "object") {
    return refs;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      refs.push(...extractAllRefs(item, itemPath));
    });
    return refs;
  }

  const record = obj as Record<string, unknown>;

  // Check if this object has a $ref
  if ("$ref" in record && isValidRef(record.$ref)) {
    refs.push({ ref: record.$ref, path });
  }

  // Recursively check nested objects
  for (const [key, value] of Object.entries(record)) {
    if (key === "$ref") continue; // Already handled above
    if (typeof value === "object" && value !== null) {
      const nestedPath = path ? `${path}.${key}` : key;
      refs.push(...extractAllRefs(value, nestedPath));
    }
  }

  return refs;
}

/**
 * Validate the structure of $ref objects
 */
export function validateRefStructure(
  obj: unknown,
  path = ""
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!obj || typeof obj !== "object") {
    return errors;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      errors.push(...validateRefStructure(item, itemPath));
    });
    return errors;
  }

  const record = obj as Record<string, unknown>;

  // Check if this object has a $ref
  if ("$ref" in record) {
    const ref = record.$ref;

    // Check if $ref is an object
    if (typeof ref !== "object" || ref === null || Array.isArray(ref)) {
      errors.push({
        type: "structure",
        message: `$ref must be an object with configName, version, and schemaId properties`,
        path: path || "/",
        severity: "error",
      });
      return errors; // Don't continue checking if structure is wrong
    }

    const refObj = ref as Record<string, unknown>;

    // Validate required fields
    if (!("configName" in refObj) || typeof refObj.configName !== "string") {
      errors.push({
        type: "structure",
        message: `$ref is missing required property 'configName'`,
        path: path || "/",
        severity: "error",
      });
    }

    if (
      !("version" in refObj) ||
      (typeof refObj.version !== "string" && typeof refObj.version !== "number")
    ) {
      errors.push({
        type: "structure",
        message: `$ref is missing required property 'version'`,
        path: path || "/",
        severity: "error",
      });
    }

    if (!("schemaId" in refObj) || typeof refObj.schemaId !== "string") {
      errors.push({
        type: "structure",
        message: `$ref is missing required property 'schemaId'`,
        path: path || "/",
        severity: "error",
      });
    }
  }

  // Recursively check nested objects
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "object" && value !== null) {
      const nestedPath = path ? `${path}.${key}` : key;
      errors.push(...validateRefStructure(value, nestedPath));
    }
  }

  return errors;
}

/**
 * Resolve all $ref objects in a config by fetching and merging referenced configs
 * Mirrors backend replaceRefs logic from configManager.ts
 */
export async function resolveRefs(
  obj: unknown,
  fetchConfig: FetchConfigFn,
  visited: Set<string> = new Set()
): Promise<{ resolved: unknown; errors: ResolutionError[] }> {
  const errors: ResolutionError[] = [];

  // Handle primitives
  if (!obj || typeof obj !== "object") {
    return { resolved: obj, errors };
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const resolvedArray: unknown[] = [];
    for (const item of obj) {
      const result = await resolveRefs(item, fetchConfig, new Set(visited));
      resolvedArray.push(result.resolved);
      errors.push(...result.errors);
    }
    return { resolved: resolvedArray, errors };
  }

  // Clone object to avoid mutation
  const resolved = { ...(obj as Record<string, unknown>) };

  // Check if this object has a $ref
  if ("$ref" in resolved && isValidRef(resolved.$ref)) {
    const ref = resolved.$ref;

    // Check for circular references
    const refKey = `${ref.configName}@${ref.version}@${ref.schemaId}`;
    if (visited.has(refKey)) {
      errors.push({
        type: "circular-ref",
        message: `Circular reference detected: ${refKey}`,
        ref,
        path: "",
      });
      return { resolved, errors };
    }

    try {
      // Fetch referenced config
      const referencedConfig = await fetchConfig(ref);

      if (!referencedConfig) {
        errors.push({
          type: "missing-ref",
          message: `Referenced config not found: ${ref.configName}@${ref.version}`,
          ref,
          path: "",
        });
        return { resolved, errors };
      }

      // Recursively resolve refs in the referenced config
      visited.add(refKey);
      const refResult = await resolveRefs(
        referencedConfig.config,
        fetchConfig,
        new Set(visited)
      );
      visited.delete(refKey);

      errors.push(...refResult.errors);

      // Merge: delete $ref, then merge resolved config with current props
      // Backend does: { ...prevValue (without $ref), ...config.config }
      // Local properties override ref properties
      delete resolved.$ref;
      
      // Type guard: only spread if refResult.resolved is an object
      if (typeof refResult.resolved === "object" && refResult.resolved !== null && !Array.isArray(refResult.resolved)) {
        return {
          resolved: { ...refResult.resolved, ...resolved },
          errors,
        };
      }
      
      // If ref resolved to non-object, return it directly
      return {
        resolved: refResult.resolved,
        errors,
      };
    } catch (error) {
      errors.push({
        type: "fetch-error",
        message: `Failed to fetch config: ${error instanceof Error ? error.message : String(error)}`,
        ref,
        path: "",
      });
      return { resolved, errors };
    }
  }

  // Recursively resolve nested properties
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "object" && value !== null) {
      const result = await resolveRefs(value, fetchConfig, new Set(visited));
      resolved[key] = result.resolved;
      errors.push(...result.errors);
    }
  }

  return { resolved, errors };
}

/**
 * Validate a config against a JSON schema using Ajv
 * Applies schema defaults before validation (mirrors backend behavior)
 */
export async function validateWithSchema(
  config: unknown,
  schema: unknown
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Create fresh Ajv instance to avoid schema ID collisions
    // This prevents "schema with key or id already exists" errors
    // when validating multiple configs with the same schema
    const ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      useDefaults: true 
    });
    addFormats(ajv);
    
    // Clone config to avoid mutating original (Ajv with useDefaults mutates the object)
    const configWithDefaults = JSON.parse(JSON.stringify(config));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validate = ajv.compile(schema as any);
    
    // Ajv will apply defaults to configWithDefaults during validation
    const valid = validate(configWithDefaults);

    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        errors.push({
          type: "schema",
          message: err.message || "Validation error",
          path: err.instancePath || "/",
          severity: "error",
        });
      }
    }
  } catch (error) {
    errors.push({
      type: "schema",
      message: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
      path: "/",
      severity: "error",
    });
  }

  return errors;
}
