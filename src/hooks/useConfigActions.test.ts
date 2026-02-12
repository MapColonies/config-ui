import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConfigActions } from "./useConfigActions";
import * as wizardNavigation from "@/lib/wizard-navigation";

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock wizard-navigation module
vi.mock("@/lib/wizard-navigation", () => ({
  prepareWizardNavigation: vi.fn(),
}));

describe("useConfigActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNewVersion", () => {
    it("should navigate to wizard with edit mode", () => {
      const mockNavOptions: any = {
        to: "/wizard",
        search: {
          mode: "edit",
          configName: "my-config",
          schemaId: "https://example.com/schema/v1",
        },
      };

      vi.mocked(wizardNavigation.prepareWizardNavigation).mockReturnValue(
        mockNavOptions,
      );

      const { result } = renderHook(() => useConfigActions());

      result.current.createNewVersion(
        "my-config",
        "https://example.com/schema/v1",
      );

      expect(wizardNavigation.prepareWizardNavigation).toHaveBeenCalledWith({
        mode: "edit",
        configName: "my-config",
        schemaId: "https://example.com/schema/v1",
      });

      expect(mockNavigate).toHaveBeenCalledWith(mockNavOptions);
    });

    it("should handle different config names and schema IDs", () => {
      const mockNavOptions: any = {
        to: "/wizard",
        search: {
          mode: "edit",
          configName: "another-config",
          schemaId: "https://example.com/schema/v2",
        },
      };

      vi.mocked(wizardNavigation.prepareWizardNavigation).mockReturnValue(
        mockNavOptions,
      );

      const { result } = renderHook(() => useConfigActions());

      result.current.createNewVersion(
        "another-config",
        "https://example.com/schema/v2",
      );

      expect(wizardNavigation.prepareWizardNavigation).toHaveBeenCalledWith({
        mode: "edit",
        configName: "another-config",
        schemaId: "https://example.com/schema/v2",
      });

      expect(mockNavigate).toHaveBeenCalledWith(mockNavOptions);
    });
  });

  describe("rollback", () => {
    it("should navigate to wizard with rollback mode", () => {
      const mockNavOptions: any = {
        to: "/wizard",
        search: {
          mode: "rollback",
          configName: "my-config",
          schemaId: "https://example.com/schema/v1",
          targetVersion: 3,
        },
      };

      vi.mocked(wizardNavigation.prepareWizardNavigation).mockReturnValue(
        mockNavOptions,
      );

      const { result } = renderHook(() => useConfigActions());

      result.current.rollback(
        "my-config",
        "https://example.com/schema/v1",
        3,
      );

      expect(wizardNavigation.prepareWizardNavigation).toHaveBeenCalledWith({
        mode: "rollback",
        configName: "my-config",
        schemaId: "https://example.com/schema/v1",
        targetVersion: 3,
      });

      expect(mockNavigate).toHaveBeenCalledWith(mockNavOptions);
    });

    it("should handle different versions", () => {
      const mockNavOptions: any = {
        to: "/wizard",
        search: {
          mode: "rollback",
          configName: "test-config",
          schemaId: "https://example.com/schema",
          targetVersion: 1,
        },
      };

      vi.mocked(wizardNavigation.prepareWizardNavigation).mockReturnValue(
        mockNavOptions,
      );

      const { result } = renderHook(() => useConfigActions());

      result.current.rollback("test-config", "https://example.com/schema", 1);

      expect(wizardNavigation.prepareWizardNavigation).toHaveBeenCalledWith({
        mode: "rollback",
        configName: "test-config",
        schemaId: "https://example.com/schema",
        targetVersion: 1,
      });

      expect(mockNavigate).toHaveBeenCalledWith(mockNavOptions);
    });

    it("should handle rollback to version 0", () => {
      const mockNavOptions: any = {
        to: "/wizard",
        search: {
          mode: "rollback",
          configName: "config",
          schemaId: "schema",
          targetVersion: 0,
        },
      };

      vi.mocked(wizardNavigation.prepareWizardNavigation).mockReturnValue(
        mockNavOptions,
      );

      const { result } = renderHook(() => useConfigActions());

      result.current.rollback("config", "schema", 0);

      expect(wizardNavigation.prepareWizardNavigation).toHaveBeenCalledWith({
        mode: "rollback",
        configName: "config",
        schemaId: "schema",
        targetVersion: 0,
      });
    });
  });

  it("should return both actions from the hook", () => {
    const { result } = renderHook(() => useConfigActions());

    expect(result.current).toHaveProperty("createNewVersion");
    expect(result.current).toHaveProperty("rollback");
    expect(typeof result.current.createNewVersion).toBe("function");
    expect(typeof result.current.rollback).toBe("function");
  });
});
