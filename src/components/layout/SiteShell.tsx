import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border/50 bg-background/80 px-2 backdrop-blur-md">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">Menu</span>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
