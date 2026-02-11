import { describe, it, expect } from "vitest";
import { traverseObject, extractMatchingStrings } from "./recursive-traversal";

describe("recursive-traversal", () => {
  describe("traverseObject", () => {
    it("should call callback for all values including primitives", () => {
      const obj = { name: "test", age: 25 };
      const results: string[] = [];

      traverseObject(obj, (_value, path) => {
        results.push(path);
        return path;
      });

      expect(results).toContain("");
      expect(results).toContain("name");
      expect(results).toContain("age");
    });

    it("should traverse nested objects", () => {
      const obj = {
        user: {
          name: "Alice",
          address: {
            city: "NYC",
          },
        },
      };

      const paths: string[] = [];
      traverseObject(obj, (_value, path) => {
        paths.push(path);
        return path;
      });

      expect(paths).toContain("");
      expect(paths).toContain("user");
      expect(paths).toContain("user.name");
      expect(paths).toContain("user.address");
      expect(paths).toContain("user.address.city");
    });

    it("should traverse arrays and their items", () => {
      const obj = { items: ["a", "b", "c"] };
      const paths: string[] = [];

      traverseObject(obj, (_value, path) => {
        paths.push(path);
        return path;
      });

      expect(paths).toContain("");
      expect(paths).toContain("items");
      expect(paths).toContain("items[0]");
      expect(paths).toContain("items[1]");
      expect(paths).toContain("items[2]");
    });

    it("should traverse nested arrays", () => {
      const obj = { matrix: [[1, 2], [3, 4]] };
      const paths: string[] = [];

      traverseObject(obj, (_value, path) => {
        paths.push(path);
        return path;
      });

      expect(paths).toContain("");
      expect(paths).toContain("matrix");
      expect(paths).toContain("matrix[0]");
      expect(paths).toContain("matrix[0][0]");
      expect(paths).toContain("matrix[0][1]");
      expect(paths).toContain("matrix[1]");
      expect(paths).toContain("matrix[1][0]");
      expect(paths).toContain("matrix[1][1]");
    });

    it("should handle mixed nested structures", () => {
      const obj = {
        users: [
          { name: "Alice", tags: ["admin", "user"] },
          { name: "Bob", tags: ["user"] },
        ],
      };

      const paths: string[] = [];
      traverseObject(obj, (_value, path) => {
        paths.push(path);
        return path;
      });

      expect(paths).toContain("users[0].name");
      expect(paths).toContain("users[0].tags[0]");
      expect(paths).toContain("users[1].tags[0]");
    });

    it("should skip null results from callback", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const results = traverseObject(obj, (_value, path) => {
        if (path === "b") return null;
        return path;
      });

      expect(results).toContain("");
      expect(results).toContain("a");
      expect(results).not.toContain("b");
      expect(results).toContain("c");
    });

    it("should handle empty object", () => {
      const obj = {};
      const results = traverseObject(obj, (_value, path) => path);

      expect(results).toEqual([""]);
    });

    it("should handle empty array", () => {
      const obj = { items: [] };
      const results = traverseObject(obj, (_value, path) => path);

      expect(results).toContain("");
      expect(results).toContain("items");
    });

    it("should process primitives at root", () => {
      const results1 = traverseObject("string", (value) =>
        typeof value === "string" ? value : null,
      );
      expect(results1).toEqual(["string"]);

      const results2 = traverseObject(42, (value) =>
        typeof value === "number" ? value : null,
      );
      expect(results2).toEqual([42]);

      const results3 = traverseObject(true, (value) =>
        typeof value === "boolean" ? value : null,
      );
      expect(results3).toEqual([true]);
    });

    it("should process null at root", () => {
      const results = traverseObject(null, (value) => (value === null ? "null" : null));
      expect(results).toEqual(["null"]);
    });

    it("should process undefined at root", () => {
      const results = traverseObject(undefined, (value) =>
        value === undefined ? "undefined" : null,
      );
      expect(results).toEqual(["undefined"]);
    });

    it("should handle objects with null values", () => {
      const obj = { a: null, b: "value" };
      const paths: string[] = [];

      traverseObject(obj, (_value, path) => {
        paths.push(path);
        return path;
      });

      expect(paths).toContain("");
      expect(paths).toContain("a");
      expect(paths).toContain("b");
    });

    it("should allow callback to filter by value type", () => {
      const obj = { a: { x: 1 }, b: [1, 2], c: "string", d: 42 };
      const results = traverseObject(obj, (value) => {
        if (Array.isArray(value)) return "array";
        if (typeof value === "string") return "string";
        if (typeof value === "number") return "number";
        return null;
      });

      expect(results).toContain("array");
      expect(results).toContain("string");
      expect(results).toContain("number");
    });

    it("should provide correct path for deeply nested structures", () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: "deep",
            },
          },
        },
      };

      const paths: string[] = [];
      traverseObject(obj, (_value, path) => {
        if (path.includes("level4")) {
          paths.push(path);
        }
        return null;
      });

      expect(paths).toContain("level1.level2.level3.level4");
    });
  });

  describe("extractMatchingStrings", () => {
    it("should extract strings matching predicate", () => {
      const obj = {
        name: "Alice",
        email: "alice@example.com",
        age: 30,
      };

      const results = extractMatchingStrings(obj, (s) => s.includes("@"));

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        value: "alice@example.com",
        path: "email",
      });
    });

    it("should extract multiple matching strings", () => {
      const obj = {
        url1: "https://example.com",
        url2: "https://test.com",
        name: "test",
      };

      const results = extractMatchingStrings(obj, (s) => s.startsWith("https"));

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.value)).toContain("https://example.com");
      expect(results.map((r) => r.value)).toContain("https://test.com");
    });

    it("should extract from nested structures", () => {
      const obj = {
        user: {
          profile: {
            email: "user@test.com",
          },
        },
      };

      const results = extractMatchingStrings(obj, (s) => s.includes("@"));

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        value: "user@test.com",
        path: "user.profile.email",
      });
    });

    it("should extract from arrays", () => {
      const obj = {
        emails: ["alice@test.com", "bob@test.com", "invalid"],
      };

      const results = extractMatchingStrings(obj, (s) => s.includes("@"));

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe("emails[0]");
      expect(results[1].path).toBe("emails[1]");
    });

    it("should return empty array when no matches", () => {
      const obj = {
        name: "Alice",
        age: 30,
      };

      const results = extractMatchingStrings(obj, (s) => s.includes("@"));

      expect(results).toEqual([]);
    });

    it("should handle complex nested arrays and objects", () => {
      const obj = {
        users: [
          { name: "Alice", urls: ["https://a.com", "http://b.com"] },
          { name: "Bob", urls: ["https://c.com"] },
        ],
      };

      const results = extractMatchingStrings(obj, (s) => s.startsWith("https"));

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe("users[0].urls[0]");
      expect(results[0].value).toBe("https://a.com");
      expect(results[1].path).toBe("users[1].urls[0]");
      expect(results[1].value).toBe("https://c.com");
    });

    it("should only process string values", () => {
      const obj = {
        str: "test",
        num: 42,
        bool: true,
        nil: null,
      };

      const results = extractMatchingStrings(obj, () => true);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe("test");
    });

    it("should handle empty strings", () => {
      const obj = { empty: "", filled: "value" };

      const results = extractMatchingStrings(obj, (s) => s === "");

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe("");
      expect(results[0].path).toBe("empty");
    });

    it("should work with regex-based predicates", () => {
      const obj = {
        valid: "test123",
        invalid: "abc",
      };

      const results = extractMatchingStrings(obj, (s) => /\d/.test(s));

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe("test123");
    });
  });
});
