import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ValidationErrorPanel } from "./ValidationErrorPanel";
import type { editor } from "monaco-editor";

describe("ValidationErrorPanel", () => {
  describe("Success State", () => {
    it("should show success message when no errors", () => {
      render(<ValidationErrorPanel errors={[]} onErrorClick={vi.fn()} />);

      expect(
        screen.getByText("Valid JSON - No schema errors"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/validation error/)).not.toBeInTheDocument();
    });

    it("should show green checkmark icon when no errors", () => {
      const { container } = render(
        <ValidationErrorPanel errors={[]} onErrorClick={vi.fn()} />,
      );

      const successContainer = container.querySelector(".bg-green-50");
      expect(successContainer).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    const mockErrors: editor.IMarker[] = [
      {
        message: "Property 'foo' is not expected",
        severity: 8, // Monaco Error severity
        startLineNumber: 5,
        startColumn: 10,
        endLineNumber: 5,
        endColumn: 15,
        code: "",
        source: "",
        relatedInformation: [],
        tags: [],
        resource: {} as any,
        owner: "",
      },
      {
        message: "Missing required property 'bar'",
        severity: 8,
        startLineNumber: 10,
        startColumn: 1,
        endLineNumber: 10,
        endColumn: 1,
        code: "",
        source: "",
        relatedInformation: [],
        tags: [],
        resource: {} as any,
        owner: "",
      },
    ];

    it("should display error count", () => {
      render(
        <ValidationErrorPanel errors={mockErrors} onErrorClick={vi.fn()} />,
      );

      expect(screen.getByText("2 validation errors")).toBeInTheDocument();
    });

    it("should display singular 'error' for one error", () => {
      render(
        <ValidationErrorPanel
          errors={[mockErrors[0]]}
          onErrorClick={vi.fn()}
        />,
      );

      expect(screen.getByText("1 validation error")).toBeInTheDocument();
    });

    it("should display error messages with line numbers", () => {
      render(
        <ValidationErrorPanel errors={mockErrors} onErrorClick={vi.fn()} />,
      );

      expect(screen.getByText("Line 5:10")).toBeInTheDocument();
      expect(
        screen.getByText("Property 'foo' is not expected"),
      ).toBeInTheDocument();

      expect(screen.getByText("Line 10:1")).toBeInTheDocument();
      expect(
        screen.getByText("Missing required property 'bar'"),
      ).toBeInTheDocument();
    });

    it("should call onErrorClick with line number when error is clicked", async () => {
      const user = userEvent.setup();
      const onErrorClick = vi.fn();

      render(
        <ValidationErrorPanel
          errors={mockErrors}
          onErrorClick={onErrorClick}
        />,
      );

      const firstError = screen.getByText("Line 5:10");
      await user.click(firstError);

      expect(onErrorClick).toHaveBeenCalledWith(5);
      expect(onErrorClick).toHaveBeenCalledTimes(1);
    });

    it("should call onErrorClick for each error independently", async () => {
      const user = userEvent.setup();
      const onErrorClick = vi.fn();

      render(
        <ValidationErrorPanel
          errors={mockErrors}
          onErrorClick={onErrorClick}
        />,
      );

      const firstError = screen.getByText("Line 5:10");
      const secondError = screen.getByText("Line 10:1");

      await user.click(firstError);
      await user.click(secondError);

      expect(onErrorClick).toHaveBeenNthCalledWith(1, 5);
      expect(onErrorClick).toHaveBeenNthCalledWith(2, 10);
      expect(onErrorClick).toHaveBeenCalledTimes(2);
    });

    it("should have scrollable container for many errors", () => {
      const { container } = render(
        <ValidationErrorPanel errors={mockErrors} onErrorClick={vi.fn()} />,
      );

      const errorList = container.querySelector(".overflow-y-auto");
      expect(errorList).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button type", () => {
      const mockErrors: editor.IMarker[] = [
        {
          message: "Test error",
          severity: 8,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          code: "",
          source: "",
          relatedInformation: [],
          tags: [],
          resource: {} as any,
          owner: "",
        },
      ];

      const { container } = render(
        <ValidationErrorPanel errors={mockErrors} onErrorClick={vi.fn()} />,
      );

      const buttons = container.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have keyboard navigation support", async () => {
      const mockErrors: editor.IMarker[] = [
        {
          message: "Test error",
          severity: 8,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          code: "",
          source: "",
          relatedInformation: [],
          tags: [],
          resource: {} as any,
          owner: "",
        },
      ];

      const user = userEvent.setup();
      const onErrorClick = vi.fn();

      render(
        <ValidationErrorPanel
          errors={mockErrors}
          onErrorClick={onErrorClick}
        />,
      );

      // Tab to button and press Enter
      await user.tab();
      await user.keyboard("{Enter}");

      expect(onErrorClick).toHaveBeenCalledWith(1);
    });
  });
});
