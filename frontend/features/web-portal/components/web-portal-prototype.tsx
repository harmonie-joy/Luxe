"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, SearchInput, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { mockWebPortal, WebPortalPage } from "@/lib/mock-data/pocs-data";
import "./web-portal.css";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function previewDocument(data: typeof mockWebPortal, page: WebPortalPage, tokens: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(page.title)}</title><style>
    :root{${tokens}}*{box-sizing:border-box}body{margin:0;background:var(--color-bg-surface);color:var(--color-text-primary);font-family:var(--font-luxe-sans);line-height:1.6}header{display:flex;justify-content:space-between;align-items:center;gap:var(--space-4);padding:var(--space-5);border-bottom:1px solid var(--color-border-subtle);font-size:var(--font-size-eyebrow)}nav{display:flex;flex-wrap:wrap;gap:var(--space-3)}main{display:grid;grid-template-columns:1fr 1fr;min-height:390px}.copy{padding:var(--space-8);align-self:center}h1{font-family:var(--font-luxe-serif);font-size:2.25rem;font-weight:400;line-height:1.2;margin:0 0 var(--space-4)}p{color:var(--color-text-secondary)}img{width:100%;height:100%;min-height:390px;object-fit:cover}.eyebrow{font-size:var(--font-size-eyebrow);text-transform:uppercase}footer{padding:var(--space-5);border-top:1px solid var(--color-border-subtle);font-size:var(--font-size-eyebrow)}@media(max-width:480px){main{grid-template-columns:1fr}.copy{padding:var(--space-6)}h1{font-size:1.75rem}img{height:200px;min-height:0}header{align-items:flex-start;flex-direction:column}}
    </style></head><body><header><strong>${escapeHtml(data.brand)}</strong><nav aria-label="Site pages">${data.pages.filter((item) => item.status === "published").map((item) => `<span>${escapeHtml(item.title)}</span>`).join("")}</nav></header><main><div class="copy"><p class="eyebrow">${escapeHtml(page.title)} / Independent design studio</p><h1>${escapeHtml(page.headline)}</h1><p>${escapeHtml(page.body)}</p></div><img src="${escapeHtml(data.image)}" alt="${escapeHtml(data.imageAlt)}"></main><footer>${escapeHtml(data.domain)} · ${page.status === "draft" ? "Draft preview" : "Sample website"}</footer></body></html>`;
}

export function WebPortalPrototype({ data }: { data: typeof mockWebPortal }) {
  const [pages, setPages] = useState<WebPortalPage[]>(() => data.pages.map((page) => ({ ...page })));
  const [selectedId, setSelectedId] = useState(data.pages[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [period, setPeriod] = useState("30");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(new Set());
  const [tokens, setTokens] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const page = pages.find((item) => item.id === selectedId)!;
  const visiblePages = pages.filter((item) => (filter === "all" || item.status === filter) && `${item.title} ${item.path}`.toLowerCase().includes(query.toLowerCase()));
  const seoChecks = [
    { label: "Page title", passed: page.seoTitle.trim().length >= 10 && page.seoTitle.length <= 60 },
    { label: "Meta description", passed: page.seoDescription.trim().length >= 50 && page.seoDescription.length <= 160 },
    { label: "Heading", passed: page.headline.trim().length > 0 },
    { label: "Image description", passed: data.imageAlt.trim().length > 0 },
  ];
  const seoScore = seoChecks.filter((check) => check.passed).length * 25;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const parent = element.closest(".luxe-pocs") ?? document.documentElement;
    function syncTheme() {
      const style = getComputedStyle(element!);
      const names = ["--color-bg-surface", "--color-text-primary", "--color-text-secondary", "--color-border-subtle", "--font-luxe-sans", "--font-luxe-serif", "--font-size-eyebrow", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8"];
      setTokens(names.map((name) => `${name}:${style.getPropertyValue(name)};`).join(""));
    }
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(parent, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  function selectPage(id: string) {
    setSelectedId(id);
    setNotice("");
  }

  function updatePage(field: "headline" | "body" | "seoTitle" | "seoDescription", value: string) {
    setPages((current) => current.map((item) => item.id === selectedId ? { ...item, [field]: value, status: "draft" } : item));
    setDirtyIds((current) => new Set([...current, selectedId]));
    setNotice("");
  }

  function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) {
      setError("Enter a page name with letters or numbers.");
      return;
    }
    const path = `/${slug}`;
    if (pages.some((item) => item.path === path)) {
      setError("A page with this address already exists.");
      return;
    }
    const id = `web-local-${slug}`;
    setPages((current) => [...current, {
      id, title, path, status: "draft", headline: title, body: "",
      seoTitle: "", seoDescription: "", updatedAt: new Date().toISOString(),
    }]);
    selectPage(id);
    setView("content");
    setCreating(false);
    setNewTitle("");
    setQuery("");
    setFilter("all");
    setDirtyIds((current) => new Set([...current, id]));
  }

  function savePage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPages((current) => current.map((item) => item.id === selectedId
      ? { ...item, updatedAt: new Date().toISOString() } : item));
    setDirtyIds((current) => new Set([...current].filter((id) => id !== selectedId)));
    setNotice(`${page.title} saved locally as a draft. No website was published.`);
  }

  return (
    <div className="luxe-web-portal luxe-pocs-stack" ref={root}>
      <header className="luxe-web-header luxe-pocs-row">
        <div><p className="luxe-eyebrow">PAGE 6 / BUILD</p><h1>Web Content Portal</h1><p className="luxe-pocs-muted">{data.domain}</p></div>
        <div className="luxe-pocs-row"><Badge>Sample site · Local changes only</Badge><Button onClick={() => { setCreating(true); setError(""); }}>New page</Button></div>
      </header>

      <section aria-label="Brand Assets summary" className="luxe-web-brand">
        <div><h2>Your Brand</h2><strong>{data.brand}</strong><p className="luxe-pocs-muted">Sample connection</p></div>
        <div><h2>Brand Colors</h2><div className="luxe-pocs-row">{data.colors.map((color) => <span className="luxe-web-swatch" style={{ background: `var(${color.token})` }} title={color.name} aria-label={color.name} key={color.name} />)}</div></div>
        <div><h2>Typography</h2><div className="luxe-pocs-row"><span className="luxe-web-type luxe-serif">Aa</span><span className="luxe-pocs-muted">{data.typography.heading}<br />{data.typography.body}</span></div></div>
        <div><h2>Brand Assets</h2><div className="luxe-pocs-row">{data.assets.map((asset) => <Image width={48} height={48} key={asset.id} src={asset.image} alt={asset.alt} />)}</div></div>
      </section>

      {creating && (
        <Card aria-label="New page">
          <form className="luxe-pocs-stack" onSubmit={createPage}>
            <h2>New page</h2>
            <label className="luxe-pocs-field">
              Page name
              <Input autoFocus maxLength={60} value={newTitle}
                onChange={(event) => { setNewTitle(event.target.value); setError(""); }}
                aria-invalid={Boolean(error)} aria-describedby={error ? "new-page-error" : undefined} />
            </label>
            {error && <p className="luxe-pocs-error" id="new-page-error" role="alert">{error}</p>}
            <div className="luxe-pocs-row">
              <Button type="submit">Create draft</Button>
              <Button variant="ghost" type="button" onClick={() => { setCreating(false); setNewTitle(""); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="luxe-web-workspace">
        <aside className="luxe-pocs-stack luxe-web-pages">
          <h2>Pages <span className="luxe-pocs-muted">{pages.length}</span></h2>
          <SearchInput aria-label="Search pages" placeholder="Search pages..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select aria-label="Filter page status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></Select>
          <nav aria-label="Website pages" className="luxe-pocs-stack">{visiblePages.map((item) => <Button key={item.id} variant="ghost" className="luxe-web-page" aria-label={`Select ${item.title} page`} aria-current={selectedId === item.id ? "page" : undefined} onClick={() => selectPage(item.id)}><span>{item.title}<small>{item.path}</small></span><Badge variant={item.status === "published" ? "active" : "pending"}>{item.status === "published" ? "Published" : "Draft"}</Badge></Button>)}</nav>
          {visiblePages.length === 0 && <p className="luxe-pocs-muted">No pages match your search and filter.</p>}
          <Button variant="outline" onClick={() => { setCreating(true); setError(""); }}>Add new page</Button>
        </aside>

        <section className="luxe-pocs-stack luxe-web-center" aria-label="Page workspace">
          <div className="luxe-pocs-row luxe-web-toolbar"><h2>{page.title}</h2><Badge>{dirtyIds.has(page.id) ? "Unsaved changes" : page.status === "draft" ? "Draft" : "Published sample"}</Badge></div>
          <Tabs ariaLabel="Page workspace view" items={[{ value: "preview", label: "Live Preview" }, { value: "content", label: "Content & SEO" }]} value={view} onValueChange={setView} />
          {view === "preview" ? (
            <div role="tabpanel" aria-label="Live Preview" className="luxe-pocs-stack">
              <div className="luxe-web-toolbar luxe-pocs-row">
                <span className="luxe-pocs-muted">{data.domain}{page.path}</span>
                <Tabs ariaLabel="Preview device"
                  items={[{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }]}
                  value={device} onValueChange={setDevice} />
              </div>
              <div className="luxe-web-preview" data-device={device}>
                <iframe title={`${page.title} website preview`} sandbox="" referrerPolicy="no-referrer"
                  srcDoc={previewDocument({ ...data, pages }, page, tokens)} />
              </div>
            </div>
          ) : (
            <form role="tabpanel" aria-label="Content & SEO" className="luxe-pocs-stack" onSubmit={savePage}>
              <label className="luxe-pocs-field">
                Headline
                <Input required value={page.headline} onChange={(event) => updatePage("headline", event.target.value)} />
              </label>
              <label className="luxe-pocs-field">
                Page content
                <textarea className="luxe-ui-input" rows={5} value={page.body}
                  onChange={(event) => updatePage("body", event.target.value)} />
              </label>
              <label className="luxe-pocs-field">
                SEO title
                <Input aria-label="SEO title" aria-describedby="seo-title-count" maxLength={60}
                  value={page.seoTitle} onChange={(event) => updatePage("seoTitle", event.target.value)} />
                <span id="seo-title-count" className="luxe-pocs-muted">{page.seoTitle.length}/60 characters</span>
              </label>
              <label className="luxe-pocs-field">
                Meta description
                <textarea aria-label="Meta description" aria-describedby="seo-description-count"
                  className="luxe-ui-input" rows={3} maxLength={160} value={page.seoDescription}
                  onChange={(event) => updatePage("seoDescription", event.target.value)} />
                <span id="seo-description-count" className="luxe-pocs-muted">{page.seoDescription.length}/160 characters</span>
              </label>
              <Button type="submit" disabled={!dirtyIds.has(page.id)}>Save local draft</Button>
            </form>
          )}
          <p role="status" className="luxe-pocs-muted">{notice}</p>
          <section className="luxe-web-suggestions"><h2>Suggested Content Ideas</h2>{data.suggestions.map((suggestion) => <Button variant="ghost" key={suggestion.pageId} onClick={() => { selectPage(suggestion.pageId); setView("content"); }}><span>{suggestion.title}</span><Badge>{suggestion.kind}</Badge></Button>)}</section>
        </section>

        <aside className="luxe-pocs-stack luxe-web-insights">
          <Card><div className="luxe-pocs-stack"><h2>Performance Overview</h2><Select aria-label="Performance period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="30">Last 30 days</option><option value="7">Last 7 days</option></Select><Badge>Sample analytics</Badge><div className="luxe-web-metrics">{data.metrics.map((metric) => <div key={metric.label}><span className="luxe-pocs-muted">{metric.label}</span><strong className="luxe-serif">{period === "30" ? metric.value : metric.weekValue}</strong><small className="luxe-web-positive">{period === "30" ? metric.change : metric.weekChange}</small></div>)}</div><div className="luxe-web-bars" aria-hidden="true">{(period === "30" ? data.activity.month : data.activity.week).map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div></div></Card>
          <Card><div className="luxe-pocs-stack"><h2>SEO Health</h2><p className="luxe-pocs-muted">{page.title} · Local content checks</p><div className="luxe-web-score"><strong className="luxe-serif">{seoScore}<small>/100</small></strong><progress aria-label="SEO health score" max={100} value={seoScore} /></div>{seoChecks.map((check) => <div className="luxe-web-toolbar luxe-pocs-row" key={check.label}><span>{check.label}</span><Badge variant={check.passed ? "active" : "pending"}>{check.passed ? "Good" : "Needs work"}</Badge></div>)}<Button variant="outline" onClick={() => setView("content")}>Review SEO</Button></div></Card>
        </aside>
      </div>
    </div>
  );
}