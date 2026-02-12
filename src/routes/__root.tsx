import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { FileJson, Settings, Plus } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/toaster";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b bg-card flex-shrink-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-3 text-foreground hover:text-foreground/80 transition-colors"
            >
              <Settings className="w-6 h-6" />
              <span className="text-lg font-semibold tracking-tight">
                Config Management
              </span>
            </Link>
            <nav className="ml-auto flex gap-1 items-center">
              <Link
                to="/schemas"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                activeProps={{
                  className:
                    "px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md flex items-center gap-2",
                }}
              >
                <FileJson className="w-4 h-4" />
                Schemas
              </Link>
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                activeProps={{
                  className:
                    "px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md flex items-center gap-2",
                }}
              >
                <Settings className="w-4 h-4" />
                Configs
              </Link>
              <Link
                to="/wizard"
                search={{ mode: "create" }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                activeProps={{
                  className:
                    "px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md flex items-center gap-2",
                }}
              >
                <Plus className="w-4 h-4" />
                Create Config
              </Link>
              <div className="ml-2">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/30 overflow-y-scroll">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  );
}
