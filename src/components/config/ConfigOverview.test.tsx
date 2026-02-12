import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfigOverview } from "./ConfigOverview";

// Mock the components from TanStack Router and UI
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: unknown }) => <a href={String(to)}>{children}</a>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe("ConfigOverview", () => {
  const mockConfig: any = {
    configName: "test-config",
    schemaId: "https://example.com/my-schema/v1",
    version: 3,
    createdAt: "2025-01-15T10:00:00Z",
    createdBy: "alice",
    hash: "abc123def456",
    isLatest: true,
    stats: {
      configSize: 2048,
      keyCount: 25,
      refCount: 3,
      depth: 4,
    },
    versions: {
      total: 2,
      all: [
        {
          version: 3,
          createdAt: "2025-01-15T10:00:00Z",
          createdBy: "alice",
          isLatest: true,
          hash: "abc123def456",
        },
      ],
    },
    dependencies: {
      parents: [
        {
          configName: "parent-config",
          version: 2,
          schemaId: "https://example.com/schema/v1",
          isLatest: true,
        },
      ],
      children: [
        {
          configName: "child-config-1",
          version: 1,
          schemaId: "https://example.com/schema/v2",
          isLatest: true,
        },
      ],
    },
    schema: {
      id: "https://example.com/my-schema/v1",
      name: "my-schema",
      version: "v1",
      category: "test",
    },
    envVars: [
      { envVar: "DB_HOST", path: "database.host", format: "string", currentValue: "localhost" },
    ],
  };

  describe("Stats Cards", () => {
    it("should render all four stat cards", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Config Size")).toBeInTheDocument();
      expect(screen.getByText("References")).toBeInTheDocument();
      expect(screen.getByText("Dependencies")).toBeInTheDocument();
      expect(screen.getByText("Versions")).toBeInTheDocument();
    });

    it("should display configuration size", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    });

    it("should display reference count", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("References")).toBeInTheDocument();
      expect(screen.getByText("config references")).toBeInTheDocument();
    });

    it("should display total dependencies", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Dependencies")).toBeInTheDocument();
      // Check for the detailed text instead of just the number
      expect(screen.getByText(/1 children.*1 parents/i)).toBeInTheDocument();
    });

    it("should display version count", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Versions")).toBeInTheDocument();
      expect(screen.getByText("Latest version")).toBeInTheDocument();
    });
  });

  describe("Configuration Details", () => {
    it("should display configuration name", () => {
      render(<ConfigOverview config={mockConfig} />);

      // Looking for the name in the details section
      expect(screen.getByText("Configuration Details")).toBeInTheDocument();
      expect(screen.getByText("test-config")).toBeInTheDocument();
    });

    it("should display current version", () => {
      render(<ConfigOverview config={mockConfig} />);

      // Looking for version label and value
      expect(screen.getByText("Version")).toBeInTheDocument();
    });

    it("should display creation date", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText(/Jan(uary)? 15, 2025/i)).toBeInTheDocument();
    });

    it("should display creator name", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Created By")).toBeInTheDocument();
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    it("should display configuration hash", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Hash")).toBeInTheDocument();
      expect(screen.getByText("abc123def456")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero dependencies", () => {
      const noDeps = {
        ...mockConfig,
        dependencies: { parents: [], children: [] },
      };
      render(<ConfigOverview config={noDeps} />);

      expect(screen.getByText(/0 children.*0 parents/i)).toBeInTheDocument();
    });

    it("should handle large configuration sizes (MB)", () => {
      const largeConfig = {
        ...mockConfig,
        stats: { ...mockConfig.stats, configSize: 2097152 }, // 2MB
      };
      render(<ConfigOverview config={largeConfig} />);

      expect(screen.getByText("Config Size")).toBeInTheDocument();
      expect(screen.getByText("2.0 MB")).toBeInTheDocument();
    });

    it("should show 'Latest version' text for latest configs", () => {
      render(<ConfigOverview config={mockConfig} />);

      expect(screen.getByText("Latest version")).toBeInTheDocument();
    });

    it("should show 'Older version' text for non-latest configs", () => {
      const olderConfig = { ...mockConfig, isLatest: false };
      render(<ConfigOverview config={olderConfig} />);

      expect(screen.getByText("Older version")).toBeInTheDocument();
    });
  });
});
