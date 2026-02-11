import { describe, it, expect } from "vitest";
import { schemaIdToPath, extractSchemaName } from "./schemaUtils";

describe("schemaUtils", () => {
  describe("schemaIdToPath", () => {
    it("should convert https schema ID to path", () => {
      const schemaId = "https://mapcolonies.com/common/db/full/v1";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("common/db/full/v1");
    });

    it("should convert http schema ID to path", () => {
      const schemaId = "http://example.com/api/v2";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("api/v2");
    });

    it("should handle schema ID with different domain", () => {
      const schemaId = "https://example.org/schemas/user/v3";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("schemas/user/v3");
    });

    it("should handle schema ID with subdomain", () => {
      const schemaId = "https://api.example.com/common/config/v1";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("common/config/v1");
    });

    it("should handle schema ID with deep path", () => {
      const schemaId =
        "https://mapcolonies.com/a/very/deep/path/to/schema/v999";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("a/very/deep/path/to/schema/v999");
    });

    it("should handle schema ID with port number", () => {
      const schemaId = "https://localhost:8080/schema/v1";
      const result = schemaIdToPath(schemaId);
      expect(result).toBe("schema/v1");
    });
  });

  describe("extractSchemaName", () => {
    it("should extract and format schema name from ID", () => {
      const schemaId = "https://mapcolonies.com/common/db/full/v1";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("CommonDbFullV1");
    });

    it("should handle single path segment", () => {
      const schemaId = "https://example.com/schema";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("Schema");
    });

    it("should handle two path segments", () => {
      const schemaId = "https://example.com/user/profile";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("UserProfile");
    });

    it("should capitalize each path segment", () => {
      const schemaId = "https://example.com/api/database/connection";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("ApiDatabaseConnection");
    });

    it("should handle path segments with numbers", () => {
      const schemaId = "https://example.com/v2/user/config";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("V2UserConfig");
    });

    it("should handle mixed case path segments", () => {
      const schemaId = "https://example.com/myApp/userProfile/v1";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("MyAppUserProfileV1");
    });

    it("should handle path with dashes (treats them as is)", () => {
      const schemaId = "https://example.com/common-db/full-schema/v1";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("Common-dbFull-schemaV1");
    });

    it("should handle uppercase first letter in segments", () => {
      const schemaId = "https://example.com/Common/DB/Full";
      const result = extractSchemaName(schemaId);
      expect(result).toBe("CommonDBFull");
    });

    it("should handle empty string segments gracefully", () => {
      const schemaId = "https://example.com///test";
      const result = extractSchemaName(schemaId);
      // Empty segments become empty strings with uppercase
      expect(result).toContain("Test");
    });
  });
});
