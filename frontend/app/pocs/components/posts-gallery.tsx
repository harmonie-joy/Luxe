"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GalleryGridLayout } from "@/components/layouts/gallery-grid-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/input";
import { MediaPreviewCard } from "@/components/ui/media-preview-card";
import { StatusPillFilter } from "@/components/ui/status-pill-filter";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { mockSinglePostLoop, type GalleryPost, type GalleryStage } from "@/lib/mock-data/pocs-data";
import type { ContentChannel } from "@/types/content";
import { APP_ROUTES } from "@/lib/routes";
import { hasAcceptedPocCaption, usePocPostSnapshot } from "@/lib/state/poc-post-state";
import styles from "./posts-gallery.module.css";

const stages: readonly (GalleryStage | "All")[] = ["All", "Ideas", "In Progress", "Review", "Ready", "Scheduled", "Published"];
const channels: Partial<Record<ContentChannel, string>> = { instagram: "Instagram", linkedin: "LinkedIn", short_video: "YouTube Short" };
const tones: Record<GalleryStage, BadgeVariant> = { Ideas: "neutral", "In Progress": "neutral", Review: "pending", Ready: "active", Scheduled: "pending", Published: "active" };
type GalleryEntry = GalleryPost & { saved?: boolean };

export function PostsGallery({ initialPosts }: { initialPosts: readonly GalleryPost[] }) {
  const router = useRouter();
  const [fixturePosts, setPosts] = useState<readonly GalleryEntry[]>(initialPosts);
  const snapshot = usePocPostSnapshot();
  const savedStage: GalleryStage = snapshot?.approved ? snapshot.schedule ? "Scheduled" : "Ready" : snapshot && hasAcceptedPocCaption(snapshot) ? "Review" : "In Progress";
  const savedPost: GalleryEntry | null = snapshot ? {
    id: mockSinglePostLoop.id, workspaceId: mockSinglePostLoop.workspaceId,
    title: mockSinglePostLoop.title, channel: mockSinglePostLoop.channel,
    createdAt: mockSinglePostLoop.createdAt, updatedAt: snapshot.versions.at(-1)?.createdAt ?? mockSinglePostLoop.updatedAt,
    status: snapshot.approved ? snapshot.schedule ? "scheduled" : "approved" : "draft", stage: savedStage,
    format: "Carousel",
    image: snapshot.assets[0].image, alt: snapshot.assets[0].alt, saved: true,
  } : null;
  const posts = [...fixturePosts.filter((post) => !savedPost || post.id !== savedPost.id), ...(savedPost ? [savedPost] : [])];
  const [stage, setStage] = useState<GalleryStage | "All">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [notice, setNotice] = useState("");
  const visible = posts.filter((post) => (stage === "All" || post.stage === stage) && `${post.title} ${channels[post.channel] ?? post.channel} ${post.format} ${post.saved ? `${snapshot?.caption} ${snapshot?.workingCaption ?? ""} ${snapshot?.template} ${snapshot?.format} ${snapshot?.format === "portrait" ? "9:16" : "1:1"}` : ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => sort === "title" ? first.title.localeCompare(second.title) : sort === "oldest" ? first.updatedAt.localeCompare(second.updatedAt) : second.updatedAt.localeCompare(first.updatedAt));

  function repurpose(post: GalleryPost, channel: ContentChannel) {
    const timestamp = new Date().toISOString();
    const copy: GalleryEntry = { ...post, saved: false, id: `${post.id}-copy-${posts.length}`, title: `${post.title} — ${channels[channel] ?? channel} idea`, channel, status: "draft", stage: "Ideas", format: channel === "short_video" ? "Video" : "Text", createdAt: timestamp, updatedAt: timestamp };
    setPosts((current) => [...current, copy]);
    setStage("Ideas");
    setQuery("");
    setSort("newest");
    setNotice(`Created a local ${channels[channel]} idea from “${post.title}”. Original unchanged. Not saved.`);
  }

  return (
    <GalleryGridLayout className={`${styles.gallery} space-y-6`} header={<header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2 min-w-0">
          <p className="luxe-eyebrow">STAGE 2 / STEP 5</p>
          <h1 className="luxe-page-title">Posts Gallery / Content Library</h1>
          <p className="luxe-page-description">Everything you’re creating, in one place.</p>
          <Badge className="w-fit" variant="neutral">Browser-local POC · synthetic fixtures labeled</Badge>
        </div>
        <Button variant="secondary" onClick={() => router.push(APP_ROUTES.pocsContentWorkspace)}>New Post</Button>
      </header>} toolbar={<div className="flex flex-wrap items-end gap-3">

        <label className="grid flex-1 gap-2 min-w-0"><span className="text-sm text-text-secondary">Search posts</span><SearchInput placeholder="Search posts…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="grid gap-2"><span className="text-sm text-text-secondary">Sort posts</span><Select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></Select></label>
      </div>} filters={<StatusPillFilter label="Post status filters" className="flex flex-wrap gap-2" value={stage} onChange={setStage} options={stages.map((filter) => ({ value: filter, label: filter, count: filter === "All" ? posts.length : posts.filter((post) => post.stage === filter).length }))} />}>
      <p role="status" className="text-sm text-text-secondary">{notice || `${visible.length} ${visible.length === 1 ? "post" : "posts"}`}</p>

      <section aria-label="Post gallery" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map((post) => (
          <Card aria-label={post.title} className={styles.card} key={post.id} padding="none">
            {post.saved && snapshot ? <div className={styles.comparison} role="group" aria-label="Saved original and working visual">
              <div><p className="luxe-eyebrow">Original · Locked</p><MediaPreviewCard className={styles.media} image={{ src: post.image, alt: post.alt, width: 1200, height: 800, className: styles.image, sizes: "(max-width: 640px) 50vw, 20vw" }} /></div>
              <div><p className="luxe-eyebrow">Working</p><MediaPreviewCard className={styles.media} data-template={snapshot.template} data-format={snapshot.format} image={{ src: post.image, alt: `Working ${post.alt}`, width: 1200, height: 800, className: styles.image, sizes: "(max-width: 640px) 50vw, 20vw" }}>
                <div className={styles.visualLayers}>{snapshot.layers.includes("Brand signature") && <span>THE LUXE STUDIO</span>}<div>{snapshot.layers.includes("Headline") && <strong>{snapshot.headline}</strong>}{snapshot.layers.includes("Accent line") && <em>{snapshot.assets[0].subtitle}</em>}</div></div>
              </MediaPreviewCard></div>
            </div> : <MediaPreviewCard className={styles.media} image={{ alt: post.alt, className: styles.image, height: 800, src: post.image, width: 1200, sizes: "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" }}>
              <Badge className={styles.platform} variant="neutral">{channels[post.channel] ?? post.channel}</Badge>
            </MediaPreviewCard>}
            <div className="grid gap-3 p-4">
              <h2 className={styles.title}>{post.title}</h2>
              <p className="text-sm text-text-secondary">{channels[post.channel] ?? post.channel} · {post.format}</p>
              <Badge className="w-fit" variant={tones[post.stage]}>{post.stage}</Badge>
              {post.saved && snapshot ? <>
                <Badge className="w-fit" variant="neutral">Saved in this browser</Badge>
                <p className={styles.caption}>{snapshot.caption}</p>
                <p className="text-sm text-text-secondary">{snapshot.template} · {snapshot.format === "portrait" ? "9:16" : "1:1"} · {snapshot.acceptedVersion ?? "Caption not accepted"}</p>
                <details><summary>Original caption · preserved</summary><p className={styles.caption}>{mockSinglePostLoop.original}</p></details>
                {snapshot.workingCaption && snapshot.workingCaption !== snapshot.caption && <details><summary>Working caption</summary><p className={styles.caption}>{snapshot.workingCaption}</p></details>}
                {snapshot.schedule && <p className="text-sm text-text-secondary">Saved schedule · {snapshot.schedule.date} · {snapshot.schedule.time} · {snapshot.schedule.timezone}</p>}
                <Link href={APP_ROUTES.pocsSinglePost} className="luxe-secondary-action">Resume saved post</Link>
              </> : <><p className="text-sm text-text-secondary">Synthetic fixture · not saved</p><time className="text-sm text-text-secondary" dateTime={post.updatedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(post.updatedAt))}</time></>}
              <Select aria-label={`Repurpose ${post.title}`} value="" onChange={(event) => repurpose(post, event.target.value as ContentChannel)}>
                <option value="" disabled>Repurpose…</option>
                <option value="linkedin">LinkedIn post</option>
                <option value="instagram">Instagram caption</option>
                <option value="short_video">Short video idea</option>
              </Select>
            </div>
          </Card>
        ))}
      </section>
      {visible.length === 0 && <div className="grid justify-items-center gap-3 py-8"><h2 className="luxe-section-title">No posts found</h2><Button variant="outline" onClick={() => { setQuery(""); setStage("All"); }}>Clear filters</Button></div>}
      <p className="text-sm text-text-secondary">{snapshot ? "The fixed demo post is saved in this browser only. Synthetic fixtures and repurposed ideas are not saved. Nothing is published." : "Illustrative only. No post, media, or publishing action is saved."}</p>
      <StageFlowFooter currentStep={5} prevRoute={APP_ROUTES.pocsSinglePost} totalSteps={5} />
    </GalleryGridLayout>
  );
}