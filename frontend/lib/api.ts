const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function toAbsoluteUrl(endpoint: string) {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

async function request<T>(
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = typeof init.body !== "undefined";
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(toAbsoluteUrl(endpoint), {
    ...init,
    headers,
    credentials: "include"
  });

  const body = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" })
};
