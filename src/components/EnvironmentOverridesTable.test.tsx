import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnvironmentOverridesTable } from "./EnvironmentOverridesTable";

describe("EnvironmentOverridesTable", () => {
  it("renders empty state when no environment overrides exist", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        port: { type: "number" },
      },
    };

    render(<EnvironmentOverridesTable schema={schema} />);

    expect(
      screen.getByText(
        "No environment variable overrides defined in this schema"
      )
    ).toBeInTheDocument();
  });

  it("renders environment overrides from schema", () => {
    const schema = {
      type: "object",
      properties: {
        database: {
          type: "object",
          properties: {
            host: {
              type: "string",
              "x-env-value": "DB_HOST",
              "x-env-format": "string",
            },
            port: {
              type: "number",
              "x-env-value": "DB_PORT",
              "x-env-format": "number",
            },
          },
        },
        apiKey: {
          type: "string",
          "x-env-value": "API_KEY",
        },
      },
    };

    render(<EnvironmentOverridesTable schema={schema} />);

    expect(screen.getByText("DB_HOST")).toBeInTheDocument();
    expect(screen.getByText("database.host")).toBeInTheDocument();
    expect(screen.getByText("string")).toBeInTheDocument();

    expect(screen.getByText("DB_PORT")).toBeInTheDocument();
    expect(screen.getByText("database.port")).toBeInTheDocument();
    expect(screen.getByText("number")).toBeInTheDocument();

    expect(screen.getByText("API_KEY")).toBeInTheDocument();
    expect(screen.getByText("apiKey")).toBeInTheDocument();
  });

  it("handles nested properties correctly", () => {
    const schema = {
      type: "object",
      properties: {
        server: {
          type: "object",
          properties: {
            config: {
              type: "object",
              properties: {
                timeout: {
                  type: "number",
                  "x-env-value": "SERVER_TIMEOUT",
                },
              },
            },
          },
        },
      },
    };

    render(<EnvironmentOverridesTable schema={schema} />);

    expect(screen.getByText("SERVER_TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("server.config.timeout")).toBeInTheDocument();
  });

  it("handles array items correctly", () => {
    const schema = {
      type: "object",
      properties: {
        endpoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                "x-env-value": "ENDPOINT_URL",
              },
            },
          },
        },
      },
    };

    render(<EnvironmentOverridesTable schema={schema} />);

    expect(screen.getByText("ENDPOINT_URL")).toBeInTheDocument();
    expect(screen.getByText("endpoints[*].url")).toBeInTheDocument();
  });

  it("shows 'Not specified' when format is missing", () => {
    const schema = {
      type: "object",
      properties: {
        value: {
          type: "string",
          "x-env-value": "SOME_VALUE",
        },
      },
    };

    render(<EnvironmentOverridesTable schema={schema} />);

    expect(screen.getByText("Not specified")).toBeInTheDocument();
  });
});
