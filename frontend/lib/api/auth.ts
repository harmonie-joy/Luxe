import { httpClient } from "@/lib/api/http-client";
import type { AuthSession } from "@/types/auth";

export const AUTH_SESSION_UPDATED_EVENT = "theluxe:session-updated";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginPayload {
  display_name: string;
}

export function prepareCsrf(): Promise<{ detail: string }> {
  return httpClient.get("/api/auth/csrf/");
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return httpClient.post("/api/auth/login/", payload);
}

export function signup(payload: SignupPayload): Promise<AuthSession> {
  return httpClient.post("/api/auth/signup/", payload);
}

export function bootstrapWorkspace(): Promise<AuthSession> {
  return httpClient.post("/api/auth/bootstrap-workspace/", {});
}

export function getSession(): Promise<AuthSession> {
  return httpClient.get("/api/auth/me/");
}

export interface UpdateCurrentUserPayload {
  display_name: string;
}

export function updateCurrentUser(
  payload: UpdateCurrentUserPayload,
): Promise<AuthSession> {
  return httpClient.patch("/api/auth/me/", payload);
}

export function logout(): Promise<void> {
  return httpClient.post("/api/auth/logout/", {});
}
