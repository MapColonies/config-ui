import { describe, it, expect } from "vitest";
import { prepareWizardNavigation } from "./wizard-navigation";

describe("wizard-navigation", () => {
  describe("prepareWizardNavigation", () => {
    it("should prepare navigation for create mode", () => {
      const result = prepareWizardNavigation({ mode: "create" });

      expect(result).toEqual({
        to: "/wizard",
        search: {
          mode: "create",
          configName: undefined,
          schemaId: undefined,
          targetVersion: undefined,
          fromVersion: undefined,
        },
      });
    });

    it("should prepare navigation for edit mode with config details", () => {
      const result = prepareWizardNavigation({
        mode: "edit",
        configName: "my-config",
        schemaId: "https://example.com/schema/v1",
      });

      expect(result).toEqual({
        to: "/wizard",
        search: {
          mode: "edit",
          configName: "my-config",
          schemaId: "https://example.com/schema/v1",
          targetVersion: undefined,
          fromVersion: undefined,
        },
      });
    });

    it("should prepare navigation for rollback mode with all params", () => {
      const result = prepareWizardNavigation({
        mode: "rollback",
        configName: "my-config",
        schemaId: "https://example.com/schema/v1",
        targetVersion: 3,
        fromVersion: 5,
      });

      expect(result).toEqual({
        to: "/wizard",
        search: {
          mode: "rollback",
          configName: "my-config",
          schemaId: "https://example.com/schema/v1",
          targetVersion: 3,
          fromVersion: 5,
        },
      });
    });

    it("should handle partial data for edit mode", () => {
      const result = prepareWizardNavigation({
        mode: "edit",
        schemaId: "https://example.com/schema/v1",
      });

      expect(result.to).toBe("/wizard");
      expect(result.search).toEqual({
        mode: "edit",
        configName: undefined,
        schemaId: "https://example.com/schema/v1",
        targetVersion: undefined,
        fromVersion: undefined,
      });
    });

    it("should handle targetVersion without fromVersion", () => {
      const result = prepareWizardNavigation({
        mode: "rollback",
        configName: "test",
        schemaId: "https://example.com/schema",
        targetVersion: 2,
      });

      expect(result.search).toMatchObject({
        mode: "rollback",
        targetVersion: 2,
        fromVersion: undefined,
      });
    });

    it("should always navigate to /wizard route", () => {
      const result1 = prepareWizardNavigation({ mode: "create" });
      const result2 = prepareWizardNavigation({ mode: "edit", configName: "test" });
      const result3 = prepareWizardNavigation({
        mode: "rollback",
        configName: "test",
        targetVersion: 1,
      });

      expect(result1.to).toBe("/wizard");
      expect(result2.to).toBe("/wizard");
      expect(result3.to).toBe("/wizard");
    });
  });
});
