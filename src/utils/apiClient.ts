import { API_BASE_URL } from "@/config/api";
import { getToken } from "@/utils/token";

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async patch<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  }
}

export const apiClient = new ApiClient();
