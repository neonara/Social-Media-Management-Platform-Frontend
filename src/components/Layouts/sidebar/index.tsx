"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { useUser } from "@/context/UserContext";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar, isDesktopCollapsed } =
    useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));

    // Uncomment the following line to enable multiple expanded items
    // setExpandedItems((prev) =>
    //   prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    // );
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }

            // Break the loop
            return true;
          }
        });
      });
    });
  }, [expandedItems, pathname]);

  const { role } = useUser();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile
            ? "fixed bottom-0 top-0 z-50 max-w-[290px]"
            : "sticky top-0 h-screen",
          isMobile
            ? isOpen
              ? "w-full"
              : "w-0"
            : isDesktopCollapsed
              ? "w-16"
              : "w-[290px] min-w-[250px] max-w-[290px] min-[1260px]:min-w-[250px]",
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile ? !isOpen : false}
        inert={isMobile ? !isOpen : false}
      >
        <div
          className={cn(
            "flex h-full flex-col py-8 transition-all duration-200",
            isDesktopCollapsed && !isMobile
              ? "pl-3 pr-3"
              : "pl-[25px] pr-[7px]",
          )}
        >
          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn(
                "w-full flex-shrink px-0 py-2.5 min-[850px]:py-0",
                isDesktopCollapsed && !isMobile ? "hidden" : "",
              )}
            >
              <Logo />
            </Link>

            {/* Toggle button for desktop */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
                  isDesktopCollapsed ? "mx-auto" : "mr-2",
                )}
                title={
                  isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <ArrowLeftIcon
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isDesktopCollapsed && "rotate-180",
                  )}
                />
              </button>
            )}

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div
            className={cn(
              "custom-scrollbar mt-6 flex-1 overflow-y-auto transition-all duration-200 min-[850px]:mt-10",
              isDesktopCollapsed && !isMobile ? "pr-0" : "pr-3",
            )}
          >
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                {(!isDesktopCollapsed || isMobile) && (
                  <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                    {section.label}
                  </h2>
                )}

                <nav role="navigation" aria-label={section.label}>
                  <ul
                    className={cn(
                      "space-y-2",
                      isDesktopCollapsed && !isMobile && "space-y-1",
                    )}
                  >
                    {section.items
                      .filter((item) => {
                        // Show items with no roles or empty roles array to all users
                        if (!item.roles || item.roles.length === 0) return true;
                        // Show items with specific roles only to users with matching roles
                        return item.roles.includes(role);
                      })
                      .map((item) => (
                        <li key={item.title}>
                          {item.items.length ? (
                            <div
                              title={
                                isDesktopCollapsed && !isMobile
                                  ? item.title
                                  : undefined
                              }
                            >
                              <MenuItem
                                isActive={item.items.some(
                                  ({ url }) => url === pathname,
                                )}
                                onClick={() =>
                                  (!isDesktopCollapsed || isMobile) &&
                                  toggleExpanded(item.title)
                                }
                                className={cn(
                                  isDesktopCollapsed &&
                                    !isMobile &&
                                    "justify-center p-2",
                                )}
                              >
                                {item.icon && (
                                  <item.icon
                                    className="size-6 shrink-0"
                                    aria-hidden="true"
                                  />
                                )}

                                {(!isDesktopCollapsed || isMobile) && (
                                  <>
                                    <span>{item.title}</span>
                                    <ChevronUp
                                      className={cn(
                                        "ml-auto rotate-180 transition-transform duration-200",
                                        expandedItems.includes(item.title) &&
                                          "rotate-0",
                                      )}
                                      aria-hidden="true"
                                    />
                                  </>
                                )}
                              </MenuItem>

                              {expandedItems.includes(item.title) &&
                                (!isDesktopCollapsed || isMobile) && (
                                  <ul
                                    className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                    role="menu"
                                  >
                                    {item.items.map((subItem) => (
                                      <li key={subItem.title} role="none">
                                        <MenuItem
                                          as="link"
                                          href={subItem.url || "#"}
                                          isActive={pathname === subItem.url}
                                        >
                                          <span>{subItem.title}</span>
                                        </MenuItem>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                            </div>
                          ) : (
                            (() => {
                              const href =
                                "url" in item
                                  ? item.url + ""
                                  : "/" +
                                    item.title
                                      .toLowerCase()
                                      .split(" ")
                                      .join("-");

                              return (
                                <div
                                  title={
                                    isDesktopCollapsed && !isMobile
                                      ? item.title
                                      : undefined
                                  }
                                >
                                  <MenuItem
                                    className={cn(
                                      "flex items-center gap-3 py-3",
                                      isDesktopCollapsed &&
                                        !isMobile &&
                                        "justify-center p-2",
                                    )}
                                    as="link"
                                    href={href}
                                    isActive={pathname === href}
                                  >
                                    {item.icon && (
                                      <item.icon
                                        className="size-6 shrink-0"
                                        aria-hidden="true"
                                      />
                                    )}

                                    {(!isDesktopCollapsed || isMobile) && (
                                      <span>{item.title}</span>
                                    )}
                                  </MenuItem>
                                </div>
                              );
                            })()
                          )}
                        </li>
                      ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
