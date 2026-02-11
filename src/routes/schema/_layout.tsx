import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/schema/_layout")({
  component: SchemaLayout,
});

function SchemaLayout() {
  return <Outlet />;
}
