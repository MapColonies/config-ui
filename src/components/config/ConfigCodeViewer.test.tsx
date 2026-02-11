import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigCodeViewer } from "./ConfigCodeViewer";

// Mock the Monaco Editor component
vi.mock("@/components/ReadOnlyMonacoEditor", () => ({
  ReadOnlyMonacoEditor: ({ value }: { value: string }) => (
    <div data-testid="monaco-editor" data-value={value}>{value}</div>
  ),
}));

describe("ConfigCodeViewer", () => {
  const mockRawConfig = { name: "test", value: "raw" };
  const mockResolvedConfig = { name: "test", value: "resolved" };
  const mockConfigWithDefaults = { name: "test", value: "with-defaults" };

  describe("Rendering", () => {
    it("should render with all three config type options", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      expect(screen.getByText(/Raw \(with \$refs\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Resolved \(\$refs expanded\)/i)).toBeInTheDocument();
      expect(screen.getByText(/With Defaults \(runtime values\)/i)).toBeInTheDocument();
    });

    it("should render the Monaco editor", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
    });

    it("should default to showing With Defaults config", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain("with-defaults");
    });
  });

  describe("Radio Button Toggling", () => {
    it("should switch to Raw view when clicked", async () => {
      const user = userEvent.setup();

      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const rawButton = screen.getByText(/Raw \(with \$refs\)/i);
      await user.click(rawButton);

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain('"value": "raw"');
    });

    it("should switch to Resolved view when clicked", async () => {
      const user = userEvent.setup();

      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const resolvedButton = screen.getByText(/Resolved \(\$refs expanded\)/i);
      await user.click(resolvedButton);

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain('"value": "resolved"');
    });

    it("should switch between views multiple times", async () => {
      const user = userEvent.setup();

      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      // Start with defaults
      expect(screen.getByTestId("monaco-editor").textContent).toContain("with-defaults");

      // Switch to raw
      await user.click(screen.getByText(/Raw \(with \$refs\)/i));
      expect(screen.getByTestId("monaco-editor").textContent).toContain('"value": "raw"');

      // Switch to resolved
      await user.click(screen.getByText(/Resolved/i));
      expect(screen.getByTestId("monaco-editor").textContent).toContain('"value": "resolved"');

      // Switch back to defaults
      await user.click(screen.getByText(/With Defaults/i));
      expect(screen.getByTestId("monaco-editor").textContent).toContain("with-defaults");
    });
  });

  describe("JSON Formatting", () => {
    it("should format JSON with proper indentation", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const editor = screen.getByTestId("monaco-editor");
      // Should have formatted JSON (with line breaks)
      expect(editor.textContent).toMatch(/\{[\s\S]*"name"[\s\S]*\}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty objects", () => {
      render(
        <ConfigCodeViewer
          rawConfig={{}}
          resolvedConfig={{}}
          configWithDefaults={{}}
        />
      );

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain("{}");
    });

    it("should handle complex nested objects", async () => {
      const user = userEvent.setup();
      const complexConfig = {
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      };

      render(
        <ConfigCodeViewer
          rawConfig={complexConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      await user.click(screen.getByText(/Raw \(with \$refs\)/i));

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain("level1");
      expect(editor.textContent).toContain("level2");
      expect(editor.textContent).toContain("level3");
    });

    it("should handle null values in config", async () => {
      const user = userEvent.setup();
      const configWithNull = { value: null, active: true };

      render(
        <ConfigCodeViewer
          rawConfig={configWithNull}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      await user.click(screen.getByText(/Raw \(with \$refs\)/i));

      const editor = screen.getByTestId("monaco-editor");
      expect(editor.textContent).toContain("null");
      expect(editor.textContent).toContain("active");
    });
  });

  describe("Accessibility", () => {
    it("should have proper radio group structure", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const radioButtons = screen.getAllByRole("radio");
      expect(radioButtons).toHaveLength(3);
    });

    it("should have one checked radio button by default", () => {
      render(
        <ConfigCodeViewer
          rawConfig={mockRawConfig}
          resolvedConfig={mockResolvedConfig}
          configWithDefaults={mockConfigWithDefaults}
        />
      );

      const radioButtons = screen.getAllByRole("radio");
      const checkedRadios = radioButtons.filter((radio) => radio.getAttribute("data-state") === "checked");
      expect(checkedRadios).toHaveLength(1);
    });
  });
});
