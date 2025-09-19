import { useCallback, useState } from "react";
import { getClientPages } from "@/services/socialMedia";
import { SocialPage } from "@/types/social-page";

/**
 * Fetch client pages for a specific client
 * @param clientId - The ID of the client
 * @returns Promise<SocialPage[]> - Array of social pages for the client
 */
export const fetchClientPages = async (
  clientId: number | string,
): Promise<SocialPage[]> => {
  console.log("fetchClientPages called with clientId:", clientId);

  if (!clientId) {
    console.warn("fetchClientPages: No client ID provided");
    return [];
  }

  try {
    const result = await getClientPages(String(clientId));

    // Check if result is an error object
    if (result && typeof result === "object" && "error" in result) {
      console.error(
        `Error fetching pages for client ${clientId}:`,
        result.error,
      );
      return [];
    }

    const pages = result as SocialPage[];
    console.log(`Fetched ${pages.length} pages for client ${clientId}:`, pages);
    return pages;
  } catch (error) {
    console.error(`Error fetching pages for client ${clientId}:`, error);
    return [];
  }
};

/**
 * Hook to manage client pages fetching and caching
 */
export const useClientPages = () => {
  const [clientPages, setClientPages] = useState<Record<number, SocialPage[]>>(
    {},
  );
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});

  const fetchAndCacheClientPages = useCallback(
    async (clientId: number) => {
      if (clientPages[clientId] || loadingPages[clientId]) {
        return clientPages[clientId] || [];
      }

      setLoadingPages((prev: Record<number, boolean>) => ({
        ...prev,
        [clientId]: true,
      }));

      try {
        const pages = await fetchClientPages(clientId);
        setClientPages((prev: Record<number, SocialPage[]>) => ({
          ...prev,
          [clientId]: pages,
        }));
        return pages;
      } finally {
        setLoadingPages((prev: Record<number, boolean>) => ({
          ...prev,
          [clientId]: false,
        }));
      }
    },
    [clientPages, loadingPages],
  );

  return {
    clientPages,
    loadingPages,
    fetchAndCacheClientPages,
  };
};
