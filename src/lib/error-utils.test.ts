import { describe, it, expect } from "vitest";
import { getErrorMessage, safeJsonParse } from "./error-utils";

describe("error-utils", () => {
  describe("getErrorMessage", () => {
    it("should extract message from Error object", () => {
      const error = new Error("Something went wrong");
      expect(getErrorMessage(error)).toBe("Something went wrong");
    });

    it("should extract message from object with message property", () => {
      const error = { message: "Custom error" };
      expect(getErrorMessage(error)).toBe("Custom error");
    });

    it("should return string error as-is", () => {
      expect(getErrorMessage("Simple error string")).toBe(
        "Simple error string",
      );
    });

    it("should handle object with non-string message property", () => {
      const error = { message: 123 };
      expect(getErrorMessage(error)).toBe("An unknown error occurred");
    });

    it("should handle null", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
    });

    it("should handle undefined", () => {
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
    });

    it("should handle number", () => {
      expect(getErrorMessage(42)).toBe("An unknown error occurred");
    });

    it("should handle object without message property", () => {
      expect(getErrorMessage({ code: 500 })).toBe("An unknown error occurred");
    });

    it("should handle empty object", () => {
      expect(getErrorMessage({})).toBe("An unknown error occurred");
    });

    it("should handle array", () => {
      expect(getErrorMessage(["error"])).toBe("An unknown error occurred");
    });
  });

  describe("safeJsonParse", () => {
    it("should parse valid JSON successfully", () => {
      const result = safeJsonParse('{"key": "value"}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ key: "value" });
      }
    });

    it("should parse valid JSON array", () => {
      const result = safeJsonParse("[1, 2, 3]");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });

    it("should parse valid JSON with nested objects", () => {
      const result = safeJsonParse('{"user": {"name": "Alice", "age": 30}}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ user: { name: "Alice", age: 30 } });
      }
    });

    it("should parse null", () => {
      const result = safeJsonParse("null");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should parse number", () => {
      const result = safeJsonParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should parse boolean", () => {
      const result = safeJsonParse("true");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("should return error for invalid JSON", () => {
      const result = safeJsonParse("{invalid json}");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(typeof result.error).toBe("string");
      }
    });

    it("should return error for incomplete JSON object", () => {
      const result = safeJsonParse('{"key": ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("should return error for trailing comma", () => {
      const result = safeJsonParse('{"key": "value",}');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("should return error for unquoted keys", () => {
      const result = safeJsonParse("{key: value}");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("should return error for single quotes", () => {
      const result = safeJsonParse("{'key': 'value'}");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it("should work with generic type parameter", () => {
      interface User {
        name: string;
        age: number;
      }
      const result = safeJsonParse<User>('{"name": "Bob", "age": 25}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Bob");
        expect(result.data.age).toBe(25);
      }
    });
  });
});
