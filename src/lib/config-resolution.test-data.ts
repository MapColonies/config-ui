/**
 * Test data for config resolution tests
 */

// Mock configs for testing
export const mockConfigs: Record<string, { config: unknown }> = {
  "infra-jobnik-db": {
    config: {
      host: "localhost",
      port: 5432,
      database: "jobnik",
    },
  },
  "common-tracing": {
    config: {
      url: "http://jaeger:14268/api/traces",
      enabled: true,
    },
  },
  "auth-service": {
    config: {
      endpoint: "https://auth.example.com",
      timeout: 3000,
    },
  },
  "nested-ref-config": {
    config: {
      service: {
        $ref: {
          configName: "auth-service",
          version: 1,
          schemaId: "https://mapcolonies.com/test/auth/v1",
        },
      },
    },
  },
};

// Mock schemas for testing
export const mockSchemas = {
  "jobnik-manager": {
    type: "object",
    properties: {
      db: {
        type: "object",
        properties: {
          host: { type: "string" },
          port: { type: "number" },
          database: { type: "string" },
        },
        required: ["host", "port"],
      },
      telemetry: {
        type: "object",
        properties: {
          logger: {
            type: "object",
            properties: {
              level: { type: "string" },
              prettyPrint: { type: "boolean" },
            },
          },
          shared: { type: "object" },
          tracing: {
            type: "object",
            properties: {
              url: { type: "string" },
              enabled: { type: "boolean" },
            },
            required: ["url"],
          },
        },
        required: ["logger"],
      },
      task: {
        type: "object",
        properties: {
          staleTaskThresholdInMinutes: { type: "number" },
        },
      },
      staleTasksSweeperCron: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          schedule: { type: "string" },
        },
      },
    },
    required: ["db", "telemetry"],
  },
  // Schema with allOf and defaults (mirrors real opala-manager schema)
  "opala-manager": {
    type: "object",
    allOf: [
      {
        // Common boilerplate schema with required fields that have defaults
        type: "object",
        properties: {
          openapiConfig: {
            type: "object",
            properties: {
              filePath: { type: "string", default: "./openapi3.yaml" },
              basePath: { type: "string", default: "/docs" },
              rawPath: { type: "string", default: "/api" },
              uiPath: { type: "string", default: "/api" },
            },
            default: {
              filePath: "./openapi3.yaml",
              basePath: "/docs",
              rawPath: "/api",
              uiPath: "/api",
            },
          },
          server: {
            type: "object",
            properties: {
              port: { type: "integer", default: 8080 },
            },
            default: {
              port: 8080,
            },
          },
        },
        required: ["openapiConfig", "server"],
      },
      {
        // Service-specific schema
        type: "object",
        properties: {
          db: {
            type: "object",
            properties: {
              host: { type: "string" },
              port: { type: "number" },
              database: { type: "string" },
            },
          },
          telemetry: {
            type: "object",
            properties: {
              logger: {
                type: "object",
                properties: {
                  level: { type: "string" },
                  prettyPrint: { type: "boolean" },
                },
              },
              shared: { type: "object" },
              tracing: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  isEnabled: { type: "boolean" },
                },
              },
            },
          },
        },
        required: ["db"],
      },
    ],
  },
};

// Test configs
export const testConfigs = {
  // The actual failing config from the issue
  actualFailingConfig: {
    db: {
      $ref: {
        version: "latest",
        schemaId: "https://mapcolonies.com/common/db/full/v1",
        configName: "infra-jobnik-db",
      },
    },
    task: {
      staleTaskThresholdInMinutes: 1440,
    },
    telemetry: {
      logger: {
        level: "info",
        prettyPrint: false,
      },
      shared: {},
      tracing: {
        $ref: {
          version: "latest",
          schemaId: "https://mapcolonies.com/common/telemetry/tracing/v1",
          configName: "common-tracing",
        },
      },
    },
    staleTasksSweeperCron: {
      enabled: true,
      schedule: "*/1 * * * *",
    },
  },

  // Expected resolved version
  expectedResolvedConfig: {
    db: {
      host: "localhost",
      port: 5432,
      database: "jobnik",
    },
    task: {
      staleTaskThresholdInMinutes: 1440,
    },
    telemetry: {
      logger: {
        level: "info",
        prettyPrint: false,
      },
      shared: {},
      tracing: {
        url: "http://jaeger:14268/api/traces",
        enabled: true,
      },
    },
    staleTasksSweeperCron: {
      enabled: true,
      schedule: "*/1 * * * *",
    },
  },

  // Pure ref at top level
  pureTopLevelRef: {
    $ref: {
      configName: "infra-jobnik-db",
      version: 1,
      schemaId: "https://mapcolonies.com/common/db/full/v1",
    },
  },

  // Mixed properties with ref
  mixedPropertiesWithRef: {
    db: {
      $ref: {
        configName: "infra-jobnik-db",
        version: 1,
        schemaId: "https://mapcolonies.com/common/db/full/v1",
      },
      connectionTimeout: 5000, // This should override/merge
    },
  },

  // Nested refs
  nestedRefs: {
    services: {
      auth: {
        $ref: {
          configName: "auth-service",
          version: 1,
          schemaId: "https://mapcolonies.com/test/auth/v1",
        },
      },
      tracing: {
        $ref: {
          configName: "common-tracing",
          version: 1,
          schemaId: "https://mapcolonies.com/common/telemetry/tracing/v1",
        },
      },
    },
  },

  // Invalid ref structures
  invalidRefMissingConfigName: {
    db: {
      $ref: {
        version: 1,
        schemaId: "https://mapcolonies.com/test",
      },
    },
  },

  invalidRefMissingVersion: {
    db: {
      $ref: {
        configName: "infra-jobnik-db",
        schemaId: "https://mapcolonies.com/test",
      },
    },
  },

  invalidRefMissingSchemaId: {
    db: {
      $ref: {
        configName: "infra-jobnik-db",
        version: 1,
      },
    },
  },

  invalidRefNotObject: {
    db: {
      $ref: "invalid-ref-string",
    },
  },

  // Config without any refs
  noRefs: {
    db: {
      host: "localhost",
      port: 5432,
    },
  },

  // Refs in arrays
  refsInArrays: {
    services: [
      {
        $ref: {
          configName: "auth-service",
          version: 1,
          schemaId: "https://mapcolonies.com/test/auth/v1",
        },
      },
      {
        $ref: {
          configName: "common-tracing",
          version: 1,
          schemaId: "https://mapcolonies.com/common/telemetry/tracing/v1",
        },
      },
    ],
  },
};
