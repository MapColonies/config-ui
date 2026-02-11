import { describe, it, expect } from "vitest";
import {
  isValidRef,
  extractAllRefs,
  validateRefStructure,
  resolveRefs,
  validateWithSchema,
  type FetchConfigFn,
} from "./config-resolution";
import { mockConfigs, mockSchemas, testConfigs } from "./config-resolution.test-data";

// Mock fetch function for tests
const mockFetch: FetchConfigFn = async (ref) => {
  const key = ref.configName;
  const config = mockConfigs[key];
  return config || null;
};

describe("config-resolution", () => {
  describe("isValidRef", () => {
    it("should return true for valid ref object", () => {
      const ref = {
        configName: "test-config",
        version: 1,
        schemaId: "https://example.com/schema/v1",
      };
      expect(isValidRef(ref)).toBe(true);
    });

    it("should return true for valid ref with latest version", () => {
      const ref = {
        configName: "test-config",
        version: "latest",
        schemaId: "https://example.com/schema/v1",
      };
      expect(isValidRef(ref)).toBe(true);
    });

    it("should return false for missing configName", () => {
      const ref = {
        version: 1,
        schemaId: "https://example.com/schema/v1",
      };
      expect(isValidRef(ref)).toBe(false);
    });

    it("should return false for missing version", () => {
      const ref = {
        configName: "test-config",
        schemaId: "https://example.com/schema/v1",
      };
      expect(isValidRef(ref)).toBe(false);
    });

    it("should return false for missing schemaId", () => {
      const ref = {
        configName: "test-config",
        version: 1,
      };
      expect(isValidRef(ref)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isValidRef("string")).toBe(false);
      expect(isValidRef(123)).toBe(false);
      expect(isValidRef(true)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidRef(null)).toBe(false);
    });

    it("should return false for array", () => {
      expect(isValidRef([])).toBe(false);
    });
  });

  describe("extractAllRefs", () => {
    it("should extract top-level ref", () => {
      const refs = extractAllRefs(testConfigs.pureTopLevelRef);
      expect(refs).toHaveLength(1);
      expect(refs[0].ref.configName).toBe("infra-jobnik-db");
      expect(refs[0].path).toBe("");
    });

    it("should extract nested refs", () => {
      const refs = extractAllRefs(testConfigs.actualFailingConfig);
      expect(refs).toHaveLength(2);
      
      const dbRef = refs.find(r => r.ref.configName === "infra-jobnik-db");
      const tracingRef = refs.find(r => r.ref.configName === "common-tracing");
      
      expect(dbRef).toBeDefined();
      expect(dbRef?.path).toBe("db");
      expect(tracingRef).toBeDefined();
      expect(tracingRef?.path).toBe("telemetry.tracing");
    });

    it("should extract multiple refs at same level", () => {
      const refs = extractAllRefs(testConfigs.nestedRefs);
      expect(refs).toHaveLength(2);
      
      const authRef = refs.find(r => r.ref.configName === "auth-service");
      const tracingRef = refs.find(r => r.ref.configName === "common-tracing");
      
      expect(authRef?.path).toBe("services.auth");
      expect(tracingRef?.path).toBe("services.tracing");
    });

    it("should extract refs in arrays", () => {
      const refs = extractAllRefs(testConfigs.refsInArrays);
      expect(refs).toHaveLength(2);
      expect(refs[0].path).toBe("services[0]");
      expect(refs[1].path).toBe("services[1]");
    });

    it("should return empty array for config without refs", () => {
      const refs = extractAllRefs(testConfigs.noRefs);
      expect(refs).toHaveLength(0);
    });

    it("should handle primitives gracefully", () => {
      expect(extractAllRefs(null)).toHaveLength(0);
      expect(extractAllRefs("string")).toHaveLength(0);
      expect(extractAllRefs(123)).toHaveLength(0);
    });
  });

  describe("validateRefStructure", () => {
    it("should return no errors for valid refs", () => {
      const errors = validateRefStructure(testConfigs.actualFailingConfig);
      expect(errors).toHaveLength(0);
    });

    it("should return error for missing configName", () => {
      const errors = validateRefStructure(testConfigs.invalidRefMissingConfigName);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("configName");
    });

    it("should return error for missing version", () => {
      const errors = validateRefStructure(testConfigs.invalidRefMissingVersion);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("version");
    });

    it("should return error for missing schemaId", () => {
      const errors = validateRefStructure(testConfigs.invalidRefMissingSchemaId);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("schemaId");
    });

    it("should return error for invalid ref structure", () => {
      const errors = validateRefStructure(testConfigs.invalidRefNotObject);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("object");
    });

    it("should validate nested refs", () => {
      const config = {
        outer: {
          inner: {
            $ref: {
              configName: "test",
              version: 1,
              // missing schemaId
            },
          },
        },
      };
      const errors = validateRefStructure(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].path).toContain("outer.inner");
    });
  });

  describe("resolveRefs", () => {
    describe("basic resolution", () => {
      it("should resolve single top-level ref", async () => {
        const result = await resolveRefs(testConfigs.pureTopLevelRef, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(result.resolved).toEqual(mockConfigs["infra-jobnik-db"].config);
      });

      it("should resolve nested ref", async () => {
        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: 1,
              schemaId: "https://mapcolonies.com/common/db/full/v1",
            },
          },
        };

        const result = await resolveRefs(config, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(result.resolved).toEqual({
          db: mockConfigs["infra-jobnik-db"].config,
        });
      });

      it("should resolve multiple refs", async () => {
        const result = await resolveRefs(testConfigs.nestedRefs, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(result.resolved).toEqual({
          services: {
            auth: mockConfigs["auth-service"].config,
            tracing: mockConfigs["common-tracing"].config,
          },
        });
      });

      it("should merge properties with ref", async () => {
        const result = await resolveRefs(testConfigs.mixedPropertiesWithRef, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        const db = (result.resolved as any).db;
        expect(db.host).toBe("localhost"); // from ref
        expect(db.port).toBe(5432); // from ref
        expect(db.connectionTimeout).toBe(5000); // from local properties
      });

      it("should prefer local properties over ref properties", async () => {
        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: 1,
              schemaId: "https://mapcolonies.com/common/db/full/v1",
            },
            port: 9999, // Override port from ref
          },
        };

        const result = await resolveRefs(config, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        const db = (result.resolved as any).db;
        expect(db.port).toBe(9999); // Local override
        expect(db.host).toBe("localhost"); // From ref
      });
    });

    describe("version handling", () => {
      it("should resolve ref with numeric version", async () => {
        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: 1,
              schemaId: "https://mapcolonies.com/common/db/full/v1",
            },
          },
        };

        const result = await resolveRefs(config, mockFetch);
        expect(result.errors).toHaveLength(0);
      });

      it("should resolve ref with latest version", async () => {
        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: "latest",
              schemaId: "https://mapcolonies.com/common/db/full/v1",
            },
          },
        };

        const result = await resolveRefs(config, mockFetch);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("error handling", () => {
      it("should return error for missing referenced config", async () => {
        const config = {
          db: {
            $ref: {
              configName: "non-existent-config",
              version: 1,
              schemaId: "https://mapcolonies.com/test",
            },
          },
        };

        const result = await resolveRefs(config, mockFetch);
        
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe("missing-ref");
        expect(result.errors[0].message).toContain("non-existent-config");
      });

      it("should return error for fetch failure", async () => {
        const failingFetch: FetchConfigFn = async () => {
          throw new Error("Network error");
        };

        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: 1,
              schemaId: "https://mapcolonies.com/test",
            },
          },
        };

        const result = await resolveRefs(config, failingFetch);
        
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe("fetch-error");
      });

      it("should continue resolving valid refs when one fails", async () => {
        const config = {
          db: {
            $ref: {
              configName: "infra-jobnik-db",
              version: 1,
              schemaId: "https://mapcolonies.com/test",
            },
          },
          tracing: {
            $ref: {
              configName: "non-existent",
              version: 1,
              schemaId: "https://mapcolonies.com/test",
            },
          },
        };

        const result = await resolveRefs(config, mockFetch);
        
        expect(result.errors).toHaveLength(1); // Only one error
        expect((result.resolved as any).db).toEqual(mockConfigs["infra-jobnik-db"].config);
      });
    });

    describe("complex scenarios", () => {
      it("should resolve the actual failing config from issue", async () => {
        const result = await resolveRefs(testConfigs.actualFailingConfig, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(result.resolved).toEqual(testConfigs.expectedResolvedConfig);
      });

      it("should resolve refs in arrays", async () => {
        const result = await resolveRefs(testConfigs.refsInArrays, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(Array.isArray((result.resolved as any).services)).toBe(true);
        expect((result.resolved as any).services[0]).toEqual(mockConfigs["auth-service"].config);
        expect((result.resolved as any).services[1]).toEqual(mockConfigs["common-tracing"].config);
      });

      it("should handle ref pointing to another ref", async () => {
        const result = await resolveRefs(
          {
            nested: {
              $ref: {
                configName: "nested-ref-config",
                version: 1,
                schemaId: "https://mapcolonies.com/test",
              },
            },
          },
          mockFetch
        );

        expect(result.errors).toHaveLength(0);
        // nested-ref-config has a ref to auth-service, which should be resolved
        expect((result.resolved as any).nested.service).toEqual(mockConfigs["auth-service"].config);
      });

      it("should handle empty objects with refs", async () => {
        const config = {
          $ref: {
            configName: "infra-jobnik-db",
            version: 1,
            schemaId: "https://mapcolonies.com/test",
          },
        };

        const result = await resolveRefs(config, mockFetch);
        
        expect(result.errors).toHaveLength(0);
        expect(result.resolved).toEqual(mockConfigs["infra-jobnik-db"].config);
      });
    });
  });

  describe("validateWithSchema", () => {
    it("should pass validation for valid config", async () => {
      const errors = await validateWithSchema(
        testConfigs.expectedResolvedConfig,
        mockSchemas["jobnik-manager"]
      );
      
      expect(errors).toHaveLength(0);
    });

    it("should return error for missing required field", async () => {
      const invalidConfig = {
        db: {
          host: "localhost",
          // missing required "port"
        },
        telemetry: {
          logger: {
            level: "info",
          },
        },
      };

      const errors = await validateWithSchema(invalidConfig, mockSchemas["jobnik-manager"]);
      
      expect(errors.length).toBeGreaterThan(0);
      const portError = errors.find(e => e.message.includes("port"));
      expect(portError).toBeDefined();
    });

    it("should return error for wrong type", async () => {
      const invalidConfig = {
        db: {
          host: "localhost",
          port: "not-a-number", // Should be number
        },
        telemetry: {
          logger: {
            level: "info",
          },
        },
      };

      const errors = await validateWithSchema(invalidConfig, mockSchemas["jobnik-manager"]);
      
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find(e => e.message.includes("type") || e.message.includes("number"));
      expect(typeError).toBeDefined();
    });

    it("should validate nested objects", async () => {
      const invalidConfig = {
        db: {
          host: "localhost",
          port: 5432,
        },
        telemetry: {
          logger: {
            level: "info",
          },
          tracing: {
            // missing required "url"
            enabled: true,
          },
        },
      };

      const errors = await validateWithSchema(invalidConfig, mockSchemas["jobnik-manager"]);
      
      expect(errors.length).toBeGreaterThan(0);
      const urlError = errors.find(e => e.path?.includes("tracing") && e.message.includes("url"));
      expect(urlError).toBeDefined();
    });

    it("should provide correct error paths", async () => {
      const invalidConfig = {
        db: {
          host: "localhost",
          port: 5432,
        },
        telemetry: {
          logger: {
            level: "info",
          },
          tracing: {
            enabled: true,
            // missing url
          },
        },
      };

      const errors = await validateWithSchema(invalidConfig, mockSchemas["jobnik-manager"]);
      
      const tracingError = errors.find(e => e.path?.includes("tracing"));
      expect(tracingError).toBeDefined();
      expect(tracingError?.path).toMatch(/telemetry.*tracing/);
    });

    it("should apply schema defaults during validation", async () => {
      // Config missing required fields that have defaults in schema
      const configWithoutDefaults = {
        db: {
          host: "localhost",
          port: 5432,
          database: "test-db",
        },
        telemetry: {
          logger: {
            level: "info",
            prettyPrint: false,
          },
          shared: {},
          tracing: {
            url: "http://collector:4318/v1/traces",
            isEnabled: true,
          },
        },
        // Missing openapiConfig and server - but they have defaults in schema
      };

      const errors = await validateWithSchema(
        configWithoutDefaults,
        mockSchemas["opala-manager"]
      );

      // Should pass validation because Ajv applies defaults
      expect(errors).toHaveLength(0);
    });

    it("should allow validating multiple configs with the same schema (no $id collision)", async () => {
      // Regression test for AJV schema ID collision bug
      // Previously, global Ajv instance would cache schemas by $id
      // causing "schema with key or id already exists" error on second validation
      
      // First validation
      const errors1 = await validateWithSchema(
        testConfigs.expectedResolvedConfig,
        mockSchemas["jobnik-manager"]
      );
      expect(errors1).toHaveLength(0);

      // Second validation with same schema - should NOT throw
      const errors2 = await validateWithSchema(
        testConfigs.expectedResolvedConfig,
        mockSchemas["jobnik-manager"]
      );
      expect(errors2).toHaveLength(0);

      // Third validation with different data, same schema - verify it keeps working
      const differentConfig = {
        db: {
          host: "test-host",
          port: 5432,
        },
        telemetry: {
          logger: {
            level: "debug",
          },
        },
      };
      
      const errors3 = await validateWithSchema(
        differentConfig,
        mockSchemas["jobnik-manager"]
      );
      expect(errors3).toHaveLength(0);
      
      // Fourth validation with same schema but invalid data
      const invalidConfig = {
        db: {
          host: "localhost",
          // missing required port
        },
        telemetry: {
          logger: {
            level: "info",
          },
        },
      };
      
      const errors4 = await validateWithSchema(
        invalidConfig,
        mockSchemas["jobnik-manager"]
      );
      expect(errors4.length).toBeGreaterThan(0);
    });

    it("should fail validation when required field has no default", async () => {
      const configMissingRequiredField = {
        // Missing db which is required and has no default
        telemetry: {
          logger: {
            level: "info",
          },
        },
        openapiConfig: {
          filePath: "./openapi3.yaml",
        },
        server: {
          port: 8080,
        },
      };

      const errors = await validateWithSchema(
        configMissingRequiredField,
        mockSchemas["opala-manager"]
      );

      // Should fail because db is required and has no default
      expect(errors.length).toBeGreaterThan(0);
      const dbError = errors.find(e => e.message.includes("db"));
      expect(dbError).toBeDefined();
    });
  });

  describe("integration tests", () => {
    it("should fully resolve and validate the actual failing config", async () => {
      // Step 1: Validate structure
      const structureErrors = validateRefStructure(testConfigs.actualFailingConfig);
      expect(structureErrors).toHaveLength(0);

      // Step 2: Extract refs
      const refs = extractAllRefs(testConfigs.actualFailingConfig);
      expect(refs).toHaveLength(2);

      // Step 3: Resolve refs
      const { resolved, errors: resolutionErrors } = await resolveRefs(
        testConfigs.actualFailingConfig,
        mockFetch
      );
      expect(resolutionErrors).toHaveLength(0);

      // Step 4: Validate against schema
      const schemaErrors = await validateWithSchema(resolved, mockSchemas["jobnik-manager"]);
      expect(schemaErrors).toHaveLength(0);

      // Step 5: Verify resolved matches expected
      expect(resolved).toEqual(testConfigs.expectedResolvedConfig);
    });

    it("should handle config with mixed regular and ref properties", async () => {
      const config = {
        db: {
          $ref: {
            configName: "infra-jobnik-db",
            version: 1,
            schemaId: "https://mapcolonies.com/common/db/full/v1",
          },
          connectionTimeout: 5000,
        },
        telemetry: {
          logger: {
            level: "debug",
            prettyPrint: true,
          },
        },
      };

      const { resolved, errors } = await resolveRefs(config, mockFetch);
      expect(errors).toHaveLength(0);
      
      const resolvedDb = (resolved as any).db;
      expect(resolvedDb.host).toBe("localhost");
      expect(resolvedDb.port).toBe(5432);
      expect(resolvedDb.connectionTimeout).toBe(5000);
    });
  });
});
