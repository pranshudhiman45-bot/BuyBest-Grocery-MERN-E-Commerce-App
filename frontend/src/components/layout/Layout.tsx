import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "../shadcn/app-sidebar";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";

export default function LayoutSideBar({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      className="flex min-h-screen w-full bg-[#e8f8ec]"
      style={
        {
          "--sidebar-width": "340px",
        } as CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset className="flex-1 min-h-screen bg-transparent">
        <div className="p-3 md:p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
