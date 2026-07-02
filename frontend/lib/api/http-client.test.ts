import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, httpClient } from "@/lib/api/http-client";

function fakeResponse(
  status: number,
  body?: unknown,
  statusText = "Status Text",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json:
      body === undefined
        ? () => Promise.reject(new Error("no body"))
        : () => Promise.resolve(body),
  } as unknown as Response;
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
    throw new Error("expected the request to fail");
  } catch (error) {
    return error as ApiError;
  }
}

function clearCsrfCookie() {
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("httpClient", () => {
  it("GETs from the default base URL with credentials and JSON headers", async () => {
    const fetchMock = mockFetch(fakeResponse(200, { hello: "world" }));

    const result = await httpClient.get<{ hello: string }>("/api/things/");

    expect(result).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/things/",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends the CSRF cookie on unsafe methods only", async () => {
    document.cookie = "csrftoken=tok-123";
    const fetchMock = mockFetch(fakeResponse(200, {}));

    await httpClient.get("/api/things/");
    await httpClient.post("/api/things/", { a: 1 });
    await httpClient.patch("/api/things/1/", { a: 2 });

    const [, getInit] = fetchMock.mock.calls[0];
    const [, postInit] = fetchMock.mock.calls[1];
    const [, patchInit] = fetchMock.mock.calls[2];
    expect(getInit.headers).not.toHaveProperty("X-CSRFToken");
    expect(postInit.headers).toMatchObject({ "X-CSRFToken": "tok-123" });
    expect(postInit.body).toBe(JSON.stringify({ a: 1 }));
    expect(patchInit.headers).toMatchObject({ "X-CSRFToken": "tok-123" });
  });

  it("passes FormData through without a JSON Content-Type", async () => {
    const fetchMock = mockFetch(fakeResponse(200, {}));
    const form = new FormData();
    form.append("title", "Sample");

    await httpClient.postForm("/api/brand-assets/", form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("resolves undefined for 204 responses", async () => {
    mockFetch(fakeResponse(204));

    await expect(httpClient.delete("/api/things/1/")).resolves.toBeUndefined();
  });

  it("throws ApiError with the JSON detail on failure", async () => {
    mockFetch(fakeResponse(403, { detail: "CSRF failed" }, "Forbidden"));

    const error = await captureError(httpClient.get("/api/things/"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
    expect(error.statusText).toBe("Forbidden");
    expect(error.message).toBe("CSRF failed");
  });

  it("falls back to the message field, then statusText", async () => {
    mockFetch(fakeResponse(400, { message: "Bad payload" }));
    const withMessage = await captureError(httpClient.get("/api/x/"));
    expect(withMessage.message).toBe("Bad payload");

    mockFetch(fakeResponse(500, undefined, "Server Error"));
    const nonJson = await captureError(httpClient.get("/api/x/"));
    expect(nonJson).toBeInstanceOf(ApiError);
    expect(nonJson.message).toBe("Server Error");
  });
});
