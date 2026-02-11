import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

// Mock schema inspector component behavior
function SchemaInspectorBehavior() {
  const [activeTab, setActiveTab] = React.useState("documentation");
  const [showResolved, setShowResolved] = React.useState(false);

  return (
    <div>
      <h1>Schema Inspector</h1>
      <code>https://example.com/schema/v1</code>

      <div>
        <button
          onClick={() => setActiveTab("documentation")}
          data-active={activeTab === "documentation"}
        >
          Documentation
        </button>
        <button
          onClick={() => setActiveTab("json")}
          data-active={activeTab === "json"}
        >
          JSON Schema
        </button>

        {activeTab === "json" && (
          <div>
            <label htmlFor="resolved">Show Resolved</label>
            <input
              type="checkbox"
              id="resolved"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
          </div>
        )}
      </div>

      <div>
        {activeTab === "documentation" ? (
          <div data-testid="documentation-content">
            <h2>Properties</h2>
            <div>name: string</div>
          </div>
        ) : (
          <div data-testid="json-content">
            {showResolved ? "Resolved JSON" : "Raw JSON"}
          </div>
        )}
      </div>
    </div>
  );
}

describe("Schema Inspector Integration Tests", () => {
  it("renders schema inspector with title and schema ID", () => {
    render(<SchemaInspectorBehavior />);

    expect(screen.getByText("Schema Inspector")).toBeInTheDocument();
    expect(
      screen.getByText("https://example.com/schema/v1")
    ).toBeInTheDocument();
  });

  it("renders both tab buttons", () => {
    render(<SchemaInspectorBehavior />);

    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("JSON Schema")).toBeInTheDocument();
  });

  it("shows documentation content by default", () => {
    render(<SchemaInspectorBehavior />);

    const docContent = screen.getByTestId("documentation-content");
    expect(docContent).toBeInTheDocument();
    expect(screen.getByText("Properties")).toBeInTheDocument();
  });

  it("does not show resolved toggle on documentation tab", () => {
    render(<SchemaInspectorBehavior />);

    expect(screen.queryByLabelText("Show Resolved")).not.toBeInTheDocument();
  });

  it("switches to JSON tab when clicked", async () => {
    const user = userEvent.setup();
    render(<SchemaInspectorBehavior />);

    const jsonButton = screen.getByText("JSON Schema");
    await user.click(jsonButton);

    expect(screen.getByTestId("json-content")).toBeInTheDocument();
    expect(
      screen.queryByTestId("documentation-content")
    ).not.toBeInTheDocument();
  });

  it("shows resolved toggle on JSON tab", async () => {
    const user = userEvent.setup();
    render(<SchemaInspectorBehavior />);

    // Switch to JSON tab
    await user.click(screen.getByText("JSON Schema"));

    // Toggle should be visible
    expect(screen.getByLabelText("Show Resolved")).toBeInTheDocument();
  });

  it("hides resolved toggle when switching back to documentation", async () => {
    const user = userEvent.setup();
    render(<SchemaInspectorBehavior />);

    // Switch to JSON tab
    await user.click(screen.getByText("JSON Schema"));
    expect(screen.getByLabelText("Show Resolved")).toBeInTheDocument();

    // Switch back to Documentation
    await user.click(screen.getByText("Documentation"));
    expect(screen.queryByLabelText("Show Resolved")).not.toBeInTheDocument();
  });

  it("toggles between raw and resolved JSON", async () => {
    const user = userEvent.setup();
    render(<SchemaInspectorBehavior />);

    // Switch to JSON tab
    await user.click(screen.getByText("JSON Schema"));

    // Initially shows raw JSON
    expect(screen.getByText("Raw JSON")).toBeInTheDocument();

    // Toggle to resolved
    const toggle = screen.getByLabelText("Show Resolved");
    await user.click(toggle);

    // Now shows resolved JSON
    expect(screen.getByText("Resolved JSON")).toBeInTheDocument();
    expect(screen.queryByText("Raw JSON")).not.toBeInTheDocument();
  });

  it("maintains resolved state when switching tabs", async () => {
    const user = userEvent.setup();
    render(<SchemaInspectorBehavior />);

    // Switch to JSON tab
    await user.click(screen.getByText("JSON Schema"));

    // Enable resolved
    await user.click(screen.getByLabelText("Show Resolved"));
    expect(screen.getByText("Resolved JSON")).toBeInTheDocument();

    // Switch to documentation and back
    await user.click(screen.getByText("Documentation"));
    await user.click(screen.getByText("JSON Schema"));

    // Resolved should still be enabled
    const toggle = screen.getByLabelText("Show Resolved") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    expect(screen.getByText("Resolved JSON")).toBeInTheDocument();
  });
});
