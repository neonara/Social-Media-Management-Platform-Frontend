import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import type { PropsWithChildren } from "react";

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full bg-gray-1 dark:bg-[#020d1a]">
          <Header />
          <main className="mx-auto w-full max-w-screen-3xl overflow-hidden p-2 md:p-4 2xl:p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
