"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/input";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import type { GalleryPost, GalleryStage } from "@/lib/mock-data/pocs-data";
import type { ContentChannel } from "@/types/content";
import { APP_ROUTES } from "@/lib/routes";
import styles from "./posts-gallery.module.css";

const stages: readonly (GalleryStage | "All")[] = ["All", "Ideas", "In Progress", "Review", "Ready", "Scheduled", "Published"];
const channels: Partial<Record<ContentChannel, string>> = { instagram: "Instagram", linkedin: "LinkedIn", short_video: "YouTube Short" };
const tones: Record<GalleryStage, BadgeVariant> = { Ideas: "neutral", "In Progress": "neutral", Review: "pending", Ready: "active", Scheduled: "pending", Published: "active" };

export function PostsGallery({ initialPosts }: { initialPosts: readonly GalleryPost[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [stage, setStage] = useState<GalleryStage | "All">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [notice, setNotice] = useState("");
  const visible = posts.filter((post) => (stage === "All" || post.stage === stage) && `${post.title} ${channels[post.channel] ?? post.channel} ${post.format}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => sort === "title" ? first.title.localeCompare(second.title) : sort === "oldest" ? first.updatedAt.localeCompare(second.updatedAt) : second.updatedAt.localeCompare(first.updatedAt));

  function repurpose(post: GalleryPost, channel: ContentChannel) {
    const timestamp = new Date().toISOString();
    const copy: GalleryPost = { ...post, id: `${post.id}-copy-${posts.length}`, title: `${post.title} — ${channels[channel] ?? channel} idea`, channel, status: "draft", stage: "Ideas", format: channel === "short_video" ? "Video" : "Text", createdAt: timestamp, updatedAt: timestamp };
    setPosts((current) => [...current, copy]);
    setStage("Ideas");
    setQuery("");
    setSort("newest");
    setNotice(`Created a local ${channels[channel]} idea from “${post.title}”. Original unchanged. Not saved.`);
  }

  return (
    <div className={`${styles.gallery} space-y-6`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2 min-w-0">
          <p className="luxe-eyebrow">STAGE 2 / STEP 5</p>
          <h1 className="luxe-page-title">Posts Gallery / Content Library</h1>
          <p className="luxe-page-description">Everything you’re creating, in one place.</p>
          <Badge className="w-fit" variant="neutral">Preview · synthetic data</Badge>
        </div>
        <Button variant="secondary" onClick={() => router.push(APP_ROUTES.pocsSinglePost)}>New Post</Button>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid flex-1 gap-2 min-w-0"><span className="text-sm text-text-secondary">Search posts</span><SearchInput placeholder="Search posts…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="grid gap-2"><span className="text-sm text-text-secondary">Sort posts</span><Select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></Select></label>
      </div>

      <nav aria-label="Post status filters" className="flex flex-wrap gap-2">
        {stages.map((filter) => <Button key={filter} size="sm" variant={stage === filter ? "secondary" : "outline"} aria-pressed={stage === filter} aria-label={filter} onClick={() => setStage(filter)}>{filter}<Badge variant="neutral">{filter === "All" ? posts.length : posts.filter((post) => post.stage === filter).length}</Badge></Button>)}
      </nav>
      <p role="status" className="text-sm text-text-secondary">{notice || `${visible.length} ${visible.length === 1 ? "post" : "posts"}`}</p>

      <section aria-label="Post gallery" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map((post) => (
          <Card aria-label={post.title} className={styles.card} key={post.id} padding="none">
            <div className={styles.media}>
              <Image alt={post.alt} className={styles.image} height={800} src={post.image} width={1200} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
              <Badge className={styles.platform} variant="neutral">{channels[post.channel] ?? post.channel}</Badge>
            </div>
            <div className="grid gap-3 p-4">
              <h2 className={styles.title}>{post.title}</h2>
              <p className="text-sm text-text-secondary">{channels[post.channel] ?? post.channel} · {post.format}</p>
              <Badge className="w-fit" variant={tones[post.stage]}>{post.stage}</Badge>
              <time className="text-sm text-text-secondary" dateTime={post.updatedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(post.updatedAt))}</time>
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
      <p className="text-sm text-text-secondary">Illustrative only. No post, media, or publishing action is saved.</p>
      <StageFlowFooter currentStep={5} prevRoute={APP_ROUTES.pocsSinglePost} totalSteps={5} />
    </div>
  );
}