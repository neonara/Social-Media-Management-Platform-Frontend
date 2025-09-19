"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import logoDark from "@/assets/logos/logo_white_icon.png";
import logo from "@/assets/logos/logo_black_icon.png";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      {isMobile && (
        <button onClick={toggleSidebar} className="mr-4">
          <Image
            src={logo}
            width={40}
            height={40}
            alt="Toggle Sidebar"
            className="block dark:hidden"
          />
          <Image
            src={logoDark}
            width={40}
            height={40}
            alt="Toggle Sidebar"
            className="hidden dark:block"
          />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      )}

      <div className="mr-4 max-md:mr-0 max-md:hidden">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white max-lg:text-heading-6">
          Dashboard
        </h1>
        <p className="font-medium max-[920px]:hidden">
          Plan&apos;It Social Media Management Dashboard Solution
        </p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[575px]:gap-4">
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
