import "@/css/lemon-milk.css";
import "@/css/style.css";

import { Sidebar } from "@/components/Layouts/sidebar";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { Header } from "@/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider } from "@/context/UserContext";

export const metadata: Metadata = {
  title: {
    template: "%s | Brand And Com Social Media Management",
    default: "Brand And Com Social Media Management",
  },
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="light" attribute="class">
          <SidebarProvider>
            <UserProvider>
              <NotificationProvider>
                <NextTopLoader color="#5750F1" showSpinner={false} />

                <div className="flex min-h-screen">
                  <Sidebar />

                  <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
                    <Header />

                    <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                      {children}
                    </main>
                  </div>
                </div>
              </NotificationProvider>
            </UserProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
