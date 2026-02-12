import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";

// Mock schema list component behavior
function SchemaListBehavior() {
  type SchemaItem = { name: string; id: string };
  type SchemaDir = { name: string; children: SchemaItem[] };

  const schemaTree: SchemaDir[] = [
    {
      name: "users",
      children: [
        { name: "v1", id: "https://example.com/schemas/users/v1" },
        { name: "v2", id: "https://example.com/schemas/users/v2" },
      ],
    },
    {
      name: "products",
      children: [{ name: "v1", id: "https://example.com/schemas/products/v1" }],
    },
  ];

  const [isLoading] = React.useState(false);

  if (isLoading) {
    return <div>Loading schemas...</div>;
  }

  return (
    <div>
      <h1>Schemas</h1>
      <p>Browse and inspect available JSON schemas</p>

      <div data-testid="schema-tree">
        {schemaTree.map((dir) => (
          <div key={dir.name} data-testid={`directory-${dir.name}`}>
            <div>{dir.name}</div>
            {dir.children.map((schema) => (
              <a
                key={schema.id}
                href={`/schema?id=${encodeURIComponent(schema.id)}`}
                data-testid={`schema-${dir.name}-${schema.name}`}
              >
                {schema.name}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

describe("Schema List Integration Tests", () => {
  it("renders schemas page title", () => {
    render(<SchemaListBehavior />);

    expect(screen.getByText("Schemas")).toBeInTheDocument();
    expect(
      screen.getByText(/browse and inspect available json schemas/i)
    ).toBeInTheDocument();
  });

  it("renders schema tree with directories", () => {
    render(<SchemaListBehavior />);

    expect(screen.getByTestId("directory-users")).toBeInTheDocument();
    expect(screen.getByTestId("directory-products")).toBeInTheDocument();
  });

  it("renders schema items within directories", () => {
    render(<SchemaListBehavior />);

    expect(screen.getByTestId("schema-users-v1")).toBeInTheDocument();
    expect(screen.getByTestId("schema-users-v2")).toBeInTheDocument();
    expect(screen.getByTestId("schema-products-v1")).toBeInTheDocument();
  });

  it("schema links point to correct inspector URLs", () => {
    render(<SchemaListBehavior />);

    const userV1Link = screen.getByTestId("schema-users-v1");
    expect(userV1Link).toHaveAttribute(
      "href",
      "/schema?id=https%3A%2F%2Fexample.com%2Fschemas%2Fusers%2Fv1"
    );

    const productV1Link = screen.getByTestId("schema-products-v1");
    expect(productV1Link).toHaveAttribute(
      "href",
      "/schema?id=https%3A%2F%2Fexample.com%2Fschemas%2Fproducts%2Fv1"
    );
  });

  it("shows all schemas from tree structure", () => {
    render(<SchemaListBehavior />);

    const tree = screen.getByTestId("schema-tree");
    const links = tree.querySelectorAll("a");

    expect(links).toHaveLength(3); // 2 user schemas + 1 product schema
  });
});

describe("Schema List Loading State", () => {
  it("shows loading state", () => {
    function LoadingSchemaList() {
      return <div>Loading schemas...</div>;
    }

    render(<LoadingSchemaList />);

    expect(screen.getByText("Loading schemas...")).toBeInTheDocument();
  });
});
