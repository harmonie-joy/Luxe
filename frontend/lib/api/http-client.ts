/**
 * Minimal HTTP client used by all API modules.
 *
 * Base URL is read from NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL so that
 * it can be configured per environment. Falls back to localhost:8000 for local
 * development against the Docker-composed backend.
 *
 * Session auth uses browser cookies. Unsafe requests also send Django's CSRF
 * cookie when it exists.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}

function getCsrfHeaders(method: string): HeadersInit {
  if (["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase())) {
    return {};
  }

  const token = getCookie("csrftoken");
  return token ? { "X-CSRFToken": token } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init.method ?? "GET";
  const isFormData = init.body instanceof FormData;

  const headers: HeadersInit = {
    ...getCsrfHeaders(method),
    ...(init.headers ?? {}),
  };
  if (!isFormData) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...init, credentials: "include", headers });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      if (typeof body?.detail === "string") detail = body.detail;
      else if (typeof body?.message === "string") detail = body.message;
      else detail = JSON.stringify(body);
    } catch {
      // Non-JSON error body — keep statusText
    }
    throw new ApiError(response.status, response.statusText, detail);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const httpClient = {
  get<T>(path: string, init?: Omit<RequestInit, "method" | "body">): Promise<T> {
    return request<T>(path, { ...init, method: "GET" });
  },

  post<T>(
    path: string,
    body: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  postForm<T>(
    path: string,
    body: FormData,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "POST",
      body,
    });
  },

  patch<T>(
    path: string,
    body: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T = void>(
    path: string,
    init?: Omit<RequestInit, "method" | "body">,
  ): Promise<T> {
    return request<T>(path, { ...init, method: "DELETE" });
  },
};
