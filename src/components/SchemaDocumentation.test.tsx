import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchemaDocumentation } from "./SchemaDocumentation";

describe("SchemaDocumentation", () => {
  it("renders schema title and description", () => {
    const schema = {
      title: "User Schema",
      description: "Schema for user objects",
      type: "object",
      properties: {},
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText("User Schema")).toBeInTheDocument();
    expect(screen.getByText("Schema for user objects")).toBeInTheDocument();
  });

  it("renders schema properties", () => {
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "User name",
        },
        age: {
          type: "number",
          description: "User age",
        },
      },
      required: ["name"],
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("User name")).toBeInTheDocument();
    expect(screen.getByText("age")).toBeInTheDocument();
    expect(screen.getByText("User age")).toBeInTheDocument();
  });

  it("shows required indicator for required fields", () => {
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("displays default values", () => {
    const schema = {
      type: "object",
      properties: {
        status: {
          type: "string",
          default: "active",
        },
      },
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText(/default:/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it("displays enum values", () => {
    const schema = {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: ["admin", "user", "guest"],
        },
      },
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText(/allowed values:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByText(/user/i)).toBeInTheDocument();
    expect(screen.getByText(/guest/i)).toBeInTheDocument();
  });

  it("handles empty schema", () => {
    const schema = {
      type: "object",
      properties: {},
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText(/no properties defined/i)).toBeInTheDocument();
  });

  it("renders nested object properties", () => {
    const schema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street: {
              type: "string",
            },
            city: {
              type: "string",
            },
          },
        },
      },
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText("address")).toBeInTheDocument();
    expect(screen.getByText("street")).toBeInTheDocument();
    expect(screen.getByText("city")).toBeInTheDocument();
  });

  it("renders array type properties", () => {
    const schema = {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    };

    render(<SchemaDocumentation schema={schema} />);

    expect(screen.getByText("tags")).toBeInTheDocument();
    expect(screen.getByText("array")).toBeInTheDocument();
  });
});
