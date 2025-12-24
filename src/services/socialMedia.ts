"use server";

import { cookies } from "next/headers";
import { API_BASE_URL } from "../config/api";
import { SocialPage } from "../types/social-page";

export interface ConnectResponse {
  success: boolean;
  page?: Partial<SocialPage>;
  error?: string;
  authUrl?: string; // URL for OAuth authentication
}

export async function getAllPages() {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/social/pages/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check if response has pages property (structured response)
    const pages = data.pages || data;

    // Convert string dates to Date objects
    if (Array.isArray(pages)) {
      pages.forEach((page: SocialPage) => {
        if (page.created_at) {
          page.created_at = new Date(page.created_at);
        }
        if (page.updated_at) {
          page.updated_at = new Date(page.updated_at);
        }
      });
    }

    return pages as SocialPage[];
  } catch (error) {
    console.error("Failed to fetch social pages:", error);
    return [];
  }
}

export async function getClientPages(clientId: string) {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(
      `${API_BASE_URL}/social/pages/client/${clientId}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check if data is an array before using forEach
    if (Array.isArray(data)) {
      // Convert string dates to Date objects
      data.forEach((page: SocialPage) => {
        if (page.created_at) {
          page.created_at = new Date(page.created_at);
        }
        if (page.updated_at) {
          page.updated_at = new Date(page.updated_at);
        }
      });

      return data as SocialPage[];
    } else {
      console.error(
        `Expected array for client ${clientId} but received:`,
        data,
      );
      return [] as SocialPage[];
    }
  } catch (error) {
    console.error(
      `Failed to fetch social pages for client ${clientId}:`,
      error,
    );
    return [];
  }
}

export async function getFacebookAccount() {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/facebook/page/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the response indicates no connected page
    if (data.connected === false) {
      return null;
    }

    // Convert string dates to Date objects
    if (data.created_at) {
      data.created_at = new Date(data.created_at);
    }
    if (data.updated_at) {
      data.updated_at = new Date(data.updated_at);
    }

    return data as SocialPage;
  } catch (error) {
    console.error("Failed to fetch Facebook account:", error);
    // Return null when there's no connected account or there was an error
    return null;
  }
}

export async function getInstagramAccount() {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/instagram/page/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the response indicates no connected page
    if (data.connected === false) {
      return null;
    }

    // Convert string dates to Date objects
    if (data.created_at) {
      data.created_at = new Date(data.created_at);
    }
    if (data.updated_at) {
      data.updated_at = new Date(data.updated_at);
    }

    return data as SocialPage;
  } catch (error) {
    console.error("Failed to fetch Instagram account:", error);
    // Return null when there's no connected account or there was an error
    return null;
  }
}

export async function getLinkedInAccount() {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return { error: "Authentication required" };
    }

    const response = await fetch(`${API_BASE_URL}/linkedin/page/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the response indicates no connected page
    if (data.connected === false) {
      return null;
    }

    // Convert string dates to Date objects
    if (data.created_at) {
      data.created_at = new Date(data.created_at);
    }
    if (data.updated_at) {
      data.updated_at = new Date(data.updated_at);
    }

    return data as SocialPage;
  } catch (error) {
    console.error("Failed to fetch LinkedIn account:", error);
    // Return null when there's no connected account or there was an error
    return null;
  }
}

export async function connectFacebook(): Promise<ConnectResponse> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get the authorization URL from backend
    const response = await fetch(`${API_BASE_URL}/facebook/connect/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // Get authorization URL from response and return it
    const { authUrl } = await response.json();

    return {
      success: true,
      authUrl: authUrl, // Return the auth URL to the client
      page: {
        id: 0,
        name: "",
        platform: "facebook",
        page_id: "0", // Required field
        connected: false, // Required field
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  } catch (error) {
    console.error(`Failed to connect Facebook:`, error);
    return {
      success: false,
      error: `Failed to connect to Facebook. Please try again.`,
    };
  }
}

export async function connectInstagram(): Promise<ConnectResponse> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get the authorization URL from backend
    const response = await fetch(`${API_BASE_URL}/instagram/connect/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // Get authorization URL from response and return it
    const { authUrl } = await response.json();

    return {
      success: true,
      authUrl: authUrl, // Return the auth URL to the client
      page: {
        id: 0,
        name: "",
        platform: "instagram",
        page_id: "0", // Required field
        connected: false, // Required field
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  } catch (error) {
    console.error(`Failed to connect Instagram:`, error);
    return {
      success: false,
      error: `Failed to connect to Instagram. Please try again.`,
    };
  }
}

export async function connectLinkedIn(): Promise<ConnectResponse> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // The backend handles redirection directly to LinkedIn OAuth
    // We need to include the auth token as a URL parameter
    // since direct redirection doesn't maintain headers
    const connectUrl = `http://localhost:8000/api/linkedin/connect/?token=${encodeURIComponent(token)}`;

    // We'll return this URL directly for the frontend to navigate to
    // This way the token will be included as a query parameter
    // The backend can extract this token to authenticate the user
    return {
      success: true,
      authUrl: connectUrl, // Return the connect URL with token that will redirect to LinkedIn
      page: {
        id: 0,
        name: "",
        platform: "linkedin",
        page_id: "0", // Required field
        connected: false, // Required field
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  } catch (error) {
    console.error(`Failed to connect Linkedin:`, error);
    return {
      success: false,
      error: `Failed to connect to LinkedIn. Please try again.`,
    };
  }
}

export async function disconnectFacebook(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/facebook/disconnect/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to disconnect Facebook account:`, error);
    return false;
  }
}

export async function disconnectInstagram(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/instagram/disconnect/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to disconnect Instagram account:`, error);
    return false;
  }
}

export async function disconnectLinkedIn(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/linkedin/disconnect/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to disconnect LinkedIn account:`, error);
    return false;
  }
}
