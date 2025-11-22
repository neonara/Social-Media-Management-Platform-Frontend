"use server";

/**
 * Report Service
 * Handles all report-related API calls and data operations
 */

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Get authentication token from cookies
 */
async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

/**
 * Create headers with authentication
 */
async function createHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Types
export interface Client {
  id: number;
  name: string;
  industry: string;
  logo: string;
  status: string;
  joinedDate: string;
  pages?: Page[];
}

export interface Page {
  id: number;
  clientId: number;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  verified: boolean;
}

export interface ReportData {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  totalFollowers: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: string;
    posts: number;
    engagement: number;
  }[];
  topPosts: {
    id: number;
    content: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    date: string;
  }[];
  engagementTrend: {
    date: string;
    engagement: number;
  }[];
  message?: string;
}

export interface ClientsAndPagesResponse {
  clients: Client[];
}

/**
 * Fetch clients based on user role
 * Uses existing /accounts endpoints
 */
async function fetchClients(): Promise<Client[]> {
  const token = await getAuthToken();
  if (!token) {
    console.error("No authentication token found - user needs to log in");
    return [];
  }

  console.log("Token found, fetching clients...");

  try {
    // First try to fetch assigned clients (for moderators/CMs)
    console.log("Trying /api/clients/assigned/ endpoint");
    let response = await fetch(`${API_URL}/api/clients/assigned/`, {
      headers: await createHeaders(),
      cache: "no-store",
    });

    console.log("Response status:", response.status);
    let data: any[];

    if (response.status === 403) {
      // If 403 (admin/super admin), fetch all users and filter for clients
      console.log(
        "Admin/SuperAdmin detected (403), fetching all users from /api/users/",
      );
      response = await fetch(`${API_URL}/api/users/`, {
        headers: await createHeaders(),
        cache: "no-store",
      });

      console.log("Users endpoint response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch users:", response.status, errorText);
        return [];
      }

      const allUsers = await response.json();
      console.log(`Fetched ${allUsers.length} total users`);
      // Filter for clients only
      data = allUsers.filter((user: any) => user.is_client);
      console.log(
        `Found ${data.length} clients for admin (filtered from users)`,
      );
    } else if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch assigned clients:",
        response.status,
        errorText,
      );
      return [];
    } else {
      data = await response.json();
      console.log(`Found ${data.length} assigned clients`);
    }

    console.log("Client data before transform:", data);

    // Transform to Client format
    const transformedClients = data.map((client: any) => ({
      id: client.id,
      name:
        client.full_name ||
        client.name ||
        client.email?.split("@")[0] ||
        `Client ${client.id}`,
      industry: client.industry || "N/A",
      logo: client.user_image || "",
      status: client.is_active ? "active" : "inactive",
      joinedDate: client.date_joined || new Date().toISOString().split("T")[0],
      pages: [], // Will be fetched separately
    }));

    console.log("Transformed clients:", transformedClients);
    return transformedClients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

/**
 * Fetch pages for a specific client
 * Uses existing /social/client/<client_id>/pages/ endpoint
 */
async function fetchClientPages(clientId: number): Promise<Page[]> {
  const token = await getAuthToken();
  if (!token) {
    console.warn("No authentication token found");
    return [];
  }

  try {
    const response = await fetch(
      `${API_URL}/api/social/pages/client/${clientId}/`,
      {
        headers: await createHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch pages for client ${clientId}:`,
        response.status,
      );
      return [];
    }

    const data = await response.json();

    // Transform to Page format
    return data.map((page: any) => ({
      id: page.id,
      clientId: clientId,
      name: page.page_name,
      platform: page.platform.charAt(0).toUpperCase() + page.platform.slice(1),
      handle: page.page_id || page.page_name,
      followers: page.permissions?.followers || 0,
      verified: page.permissions?.verified || false,
    }));
  } catch (error) {
    console.error(`Error fetching pages for client ${clientId}:`, error);
    return [];
  }
}

/**
 * Fetch clients with their pages
 * Combines fetchClients and fetchClientPages
 */
export async function fetchClientsAndPages(): Promise<{
  clients: Client[];
}> {
  console.log("🚀 [SERVER] fetchClientsAndPages called");
  const clients = await fetchClients();
  console.log("✅ [SERVER] fetchClients returned:", clients.length, "clients");
  console.log("📋 [SERVER] Client details:", JSON.stringify(clients, null, 2));

  // Fetch pages for each client
  const clientsWithPages = await Promise.all(
    clients.map(async (client) => {
      try {
        console.log(`📄 [SERVER] Fetching pages for client ${client.id}...`);
        const pages = await fetchClientPages(client.id);
        console.log(
          `✅ [SERVER] Got ${pages.length} pages for client ${client.id}`,
        );
        return { ...client, pages };
      } catch (error) {
        console.error(
          `❌ [SERVER] Failed to fetch pages for client ${client.id}:`,
          error,
        );
        return { ...client, pages: [] };
      }
    }),
  );

  console.log(
    "🎉 [SERVER] Final result:",
    clientsWithPages.length,
    "clients with pages",
  );
  return { clients: clientsWithPages };
}

/**
 * Generate a report for a specific client, page, period, and type
 */
export const generateReport = async (
  clientId: string | number,
  pageId: string | number,
  reportType: "week" | "month",
  period: string,
): Promise<ReportData> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }

  try {
    const response = await fetch(
      `${API_URL}/api/content/reports/generate/?client_id=${clientId}&page_id=${pageId}&report_type=${reportType}&period=${period}`,
      {
        headers: await createHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to generate report: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

/**
 * Flatten pages from clients response
 */
export const flattenPages = async (clients: Client[]): Promise<Page[]> => {
  const allPages: Page[] = [];
  clients.forEach((client) => {
    if (client.pages && Array.isArray(client.pages)) {
      allPages.push(...client.pages);
    }
  });
  return allPages;
};

/**
 * Filter pages by client ID
 */
export const filterPagesByClient = async (
  pages: Page[],
  clientId: string | number,
): Promise<Page[]> => {
  const numericClientId =
    typeof clientId === "string" ? parseInt(clientId) : clientId;
  return pages.filter((page) => page.clientId === numericClientId);
};

/**
 * Validate report has data
 */
export const hasReportData = async (
  data: ReportData | null,
): Promise<boolean> => {
  if (!data) return false;
  return data.totalPosts > 0;
};

/**
 * Format report period for display
 */
export const formatPeriodDisplay = async (
  reportType: "week" | "month",
  period: string,
  weekOptions?: Array<{ value: string; label: string }>,
  monthOptions?: Array<{ value: string; label: string }>,
): Promise<string> => {
  if (reportType === "week" && weekOptions) {
    const option = weekOptions.find((opt) => opt.value === period);
    return option?.label || period;
  } else if (reportType === "month" && monthOptions) {
    const option = monthOptions.find((opt) => opt.value === period);
    return option?.label || period;
  }
  return period;
};
