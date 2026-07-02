/**
 * Contract tests for the domain API clients: request paths, HTTP verbs, and
 * snake_case write payloads passed to the shared httpClient.
 */
import { describe, expect, it, vi } from "vitest";

import * as ai from "@/lib/api/ai";
import * as auth from "@/lib/api/auth";
import * as brandVoice from "@/lib/api/brand-voice";
import * as compliance from "@/lib/api/compliance";
import * as contentBriefs from "@/lib/api/content-briefs";
import * as contentDrafts from "@/lib/api/content-drafts";
import * as scheduledContent from "@/lib/api/scheduled-content";
import { httpClient } from "@/lib/api/http-client";

vi.mock("@/lib/api/http-client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/http-client")>();
  return {
    ...actual,
    httpClient: {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      postForm: vi.fn().mockResolvedValue(undefined),
      patch: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const http = vi.mocked(httpClient);

describe("auth client", () => {
  it("hits the session endpoints with snake_case payloads", async () => {
    await auth.prepareCsrf();
    expect(http.get).toHaveBeenCalledWith("/api/auth/csrf/");

    await auth.login({ email: "a@b.c", password: "pw" });
    expect(http.post).toHaveBeenCalledWith("/api/auth/login/", {
      email: "a@b.c",
      password: "pw",
    });

    await auth.signup({ display_name: "Mario", email: "a@b.c", password: "pw" });
    expect(http.post).toHaveBeenCalledWith("/api/auth/signup/", {
      display_name: "Mario",
      email: "a@b.c",
      password: "pw",
    });

    await auth.bootstrapWorkspace();
    expect(http.post).toHaveBeenCalledWith("/api/auth/bootstrap-workspace/", {});

    await auth.getSession();
    expect(http.get).toHaveBeenCalledWith("/api/auth/me/");

    await auth.updateCurrentUser({ display_name: "New" });
    expect(http.patch).toHaveBeenCalledWith("/api/auth/me/", {
      display_name: "New",
    });

    await auth.logout();
    expect(http.post).toHaveBeenCalledWith("/api/auth/logout/", {});
  });
});

describe("brand voice client", () => {
  it("reads and writes brand profiles", async () => {
    await brandVoice.getBrandProfiles();
    expect(http.get).toHaveBeenCalledWith("/api/brand-profiles/");

    await brandVoice.getBrandProfile("bp-1");
    expect(http.get).toHaveBeenCalledWith("/api/brand-profiles/bp-1/");

    const payload = {
      workspace: "ws-1",
      name: "Voice",
      audience: "Clients",
      banned_phrases: [{ id: "x-1", phrase: "go viral", reason: "trend-led" }],
    };
    await brandVoice.createBrandProfile(payload);
    expect(http.post).toHaveBeenCalledWith("/api/brand-profiles/", payload);

    await brandVoice.updateBrandProfile("bp-1", { name: "Renamed" });
    expect(http.patch).toHaveBeenCalledWith("/api/brand-profiles/bp-1/", {
      name: "Renamed",
    });
  });

  it("scopes brand assets and writes JSON or FormData", async () => {
    await brandVoice.getBrandAssets();
    expect(http.get).toHaveBeenCalledWith("/api/brand-assets/");

    await brandVoice.getBrandAssets("bp-1");
    expect(http.get).toHaveBeenCalledWith("/api/brand-assets/?brand_profile=bp-1");

    const payload = {
      brand_profile: "bp-1",
      title: "Sample",
      content: "Copy",
      word_count: 2,
    };
    await brandVoice.createBrandAsset(payload);
    expect(http.post).toHaveBeenCalledWith("/api/brand-assets/", payload);

    const file = new File(["img"], "logo.png", { type: "image/png" });
    await brandVoice.createBrandAssetUpload({
      brand_profile: "bp-1",
      title: "logo.png",
      media_type: "image",
      file,
      mime_type: "image/png",
      source_type: "uploaded",
      word_count: 0,
    });
    expect(http.postForm).toHaveBeenCalledWith(
      "/api/brand-assets/",
      expect.any(FormData),
    );
    const form = vi.mocked(http.postForm).mock.calls[0][1] as FormData;
    expect(form.get("brand_profile")).toBe("bp-1");
    expect(form.get("title")).toBe("logo.png");
    expect(form.get("media_type")).toBe("image");
    expect(form.get("file")).toBe(file);
    expect(form.get("word_count")).toBe("0");

    await brandVoice.deleteBrandAsset("asset-1");
    expect(http.delete).toHaveBeenCalledWith("/api/brand-assets/asset-1/");
  });
});

describe("AI client", () => {
  it("posts analysis, extraction, and generation payloads", async () => {
    const extraction = {
      workspace: "ws-1",
      brand_profile: "bp-1",
      asset_ids: ["a-1", "a-2"],
    };
    await ai.analyzeBrandAssets(extraction);
    expect(http.post).toHaveBeenCalledWith(
      "/api/ai/brand/analyze-assets/",
      extraction,
    );

    await ai.extractBrandVoice(extraction);
    expect(http.post).toHaveBeenCalledWith("/api/ai/brand/extract/", extraction);

    const generation = {
      workspace: "ws-1",
      brief: "brief-1",
      channels: ["newsletter" as const],
    };
    await ai.generateDrafts(generation);
    expect(http.post).toHaveBeenCalledWith("/api/ai/drafts/generate/", generation);
  });
});

describe("content briefs client", () => {
  it("uses snake_case brief payloads", async () => {
    await contentBriefs.getContentBriefs();
    expect(http.get).toHaveBeenCalledWith("/api/content-briefs/");

    const payload = {
      workspace: "ws-1",
      brand_profile: "bp-1",
      content_objective: "Objective",
      campaign_goal: "announce" as const,
      audience: "VIPs",
      target_channels: ["newsletter" as const],
    };
    await contentBriefs.createContentBrief(payload);
    expect(http.post).toHaveBeenCalledWith("/api/content-briefs/", payload);

    await contentBriefs.updateContentBrief("brief-1", { audience: "Everyone" });
    expect(http.patch).toHaveBeenCalledWith("/api/content-briefs/brief-1/", {
      audience: "Everyone",
    });

    await contentBriefs.deleteContentBrief("brief-1");
    expect(http.delete).toHaveBeenCalledWith("/api/content-briefs/brief-1/");
  });
});

describe("content drafts client", () => {
  it("filters by brief and patches draft edits", async () => {
    await contentDrafts.getContentDrafts();
    expect(http.get).toHaveBeenCalledWith("/api/content-drafts/");

    await contentDrafts.getContentDrafts("brief 1");
    expect(http.get).toHaveBeenCalledWith("/api/content-drafts/?brief=brief%201");

    await contentDrafts.createContentDraft({
      brief: "brief-1",
      title: "Title",
      channel: "blog",
    });
    expect(http.post).toHaveBeenCalledWith("/api/content-drafts/", {
      brief: "brief-1",
      title: "Title",
      channel: "blog",
    });

    await contentDrafts.updateContentDraft("draft-1", { content: "Edited" });
    expect(http.patch).toHaveBeenCalledWith("/api/content-drafts/draft-1/", {
      content: "Edited",
    });
  });
});

describe("compliance client", () => {
  it("scopes checks and issues, keeping the `check` relation name", async () => {
    await compliance.getComplianceChecks("draft-1");
    expect(http.get).toHaveBeenCalledWith("/api/compliance-checks/?draft=draft-1");

    await compliance.createComplianceCheck({ draft: "draft-1", status: "green" });
    expect(http.post).toHaveBeenCalledWith("/api/compliance-checks/", {
      draft: "draft-1",
      status: "green",
    });

    await compliance.getComplianceIssues("check-1");
    expect(http.get).toHaveBeenCalledWith("/api/compliance-issues/?check=check-1");

    const issue = {
      check: "check-1",
      title: "Missing consent",
      category: "consent" as const,
      severity: "high" as const,
      explanation: "No opt-in reference.",
    };
    await compliance.createComplianceIssue(issue);
    expect(http.post).toHaveBeenCalledWith("/api/compliance-issues/", issue);

    await compliance.updateComplianceIssue("issue-1", { severity: "low" });
    expect(http.patch).toHaveBeenCalledWith("/api/compliance-issues/issue-1/", {
      severity: "low",
    });
  });
});

describe("scheduled content client", () => {
  it("builds filter queries and snake_case schedule payloads", async () => {
    await scheduledContent.getScheduledContent();
    expect(http.get).toHaveBeenCalledWith("/api/scheduled-content/");

    await scheduledContent.getScheduledContent({
      workspaceId: "ws-1",
      draftId: "draft-1",
    });
    expect(http.get).toHaveBeenCalledWith(
      "/api/scheduled-content/?workspace=ws-1&draft=draft-1",
    );

    const payload = {
      workspace: "ws-1",
      draft: "draft-1",
      channel: "newsletter" as const,
      scheduled_for: "2026-07-01T09:00:00.000Z",
    };
    await scheduledContent.createScheduledContent(payload);
    expect(http.post).toHaveBeenCalledWith("/api/scheduled-content/", payload);

    await scheduledContent.updateScheduledContent("sched-1", {
      published_at: null,
    });
    expect(http.patch).toHaveBeenCalledWith("/api/scheduled-content/sched-1/", {
      published_at: null,
    });
  });
});
