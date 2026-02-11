import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default message", () => {
    render(<LoadingSpinner />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingSpinner message="Please wait..." />);

    expect(screen.getByText("Please wait...")).toBeInTheDocument();
  });

  it("renders with small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector(".w-4.h-4");
    expect(spinner).toBeInTheDocument();
  });

  it("renders with medium size by default", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".w-6.h-6");
    expect(spinner).toBeInTheDocument();
  });

  it("renders with large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector(".w-8.h-8");
    expect(spinner).toBeInTheDocument();
  });

  it("has animation class", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
