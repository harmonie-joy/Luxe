/**
 * Compliance Review API client.
 *
 * Read responses from the backend arrive in camelCase and map directly to the
 * frontend compliance domain types. Write payloads stay snake_case for DRF,
 * except the public issue relation field remains `check`.
 */

import type {
  ComplianceCategory,
  ComplianceCheck,
  ComplianceIssue,
  ComplianceSeverity,
  ComplianceStatus,
} from "@/types/compliance";

import { httpClient } from "./http-client";

export interface CreateComplianceCheckPayload {
  draft: string;
  status?: ComplianceStatus;
  summary?: string;
  checked_at?: string;
}

export type UpdateComplianceCheckPayload =
  Partial<CreateComplianceCheckPayload>;

export interface CreateComplianceIssuePayload {
  check: string;
  title: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  explanation: string;
  suggested_fix?: string;
}

export type UpdateComplianceIssuePayload =
  Partial<CreateComplianceIssuePayload>;

export function getComplianceChecks(
  draftId?: string,
): Promise<ComplianceCheck[]> {
  const query = draftId ? `?draft=${encodeURIComponent(draftId)}` : "";
  return httpClient.get<ComplianceCheck[]>(`/api/compliance-checks/${query}`);
}

export function getComplianceCheck(id: string): Promise<ComplianceCheck> {
  return httpClient.get<ComplianceCheck>(`/api/compliance-checks/${id}/`);
}

export function createComplianceCheck(
  payload: CreateComplianceCheckPayload,
): Promise<ComplianceCheck> {
  return httpClient.post<ComplianceCheck>("/api/compliance-checks/", payload);
}

export function updateComplianceCheck(
  id: string,
  payload: UpdateComplianceCheckPayload,
): Promise<ComplianceCheck> {
  return httpClient.patch<ComplianceCheck>(
    `/api/compliance-checks/${id}/`,
    payload,
  );
}

export function getComplianceIssues(
  checkId?: string,
): Promise<ComplianceIssue[]> {
  const query = checkId ? `?check=${encodeURIComponent(checkId)}` : "";
  return httpClient.get<ComplianceIssue[]>(`/api/compliance-issues/${query}`);
}

export function createComplianceIssue(
  payload: CreateComplianceIssuePayload,
): Promise<ComplianceIssue> {
  return httpClient.post<ComplianceIssue>("/api/compliance-issues/", payload);
}

export function updateComplianceIssue(
  id: string,
  payload: UpdateComplianceIssuePayload,
): Promise<ComplianceIssue> {
  return httpClient.patch<ComplianceIssue>(
    `/api/compliance-issues/${id}/`,
    payload,
  );
}
