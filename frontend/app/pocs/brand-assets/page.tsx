"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { mockBrandAssetKit, type BrandKitAsset } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import styles from "./page.module.css";

const categories = ["All assets", "Logos", "Fonts", "Media", "Templates", "Documents"] as const;
type CategoryFilter = (typeof categories)[number];
type AssetViewMode = "grid" | "list";

function AssetArtwork({ asset, large = false }: { asset: BrandKitAsset; large?: boolean }) {
  return (
    <div className={styles.artwork} data-kind={asset.previewKind} data-large={large || undefined}>
      {asset.image && (
        <Image
          alt={asset.alt ?? ""}
          className={styles.artworkImage}
          fill
          sizes={large ? "360px" : "(max-width: 700px) 100vw, 260px"}
          src={asset.image}
        />
      )}
      {asset.previewKind === "logo" && <><span className={styles.logoMark} aria-hidden="true">✦</span><strong>THE LUXE</strong><small>CREATOR / CEO</small></>}
      {asset.previewKind === "font" && <><span className={styles.fontSample}>Aa</span><small>{asset.format} TYPE FAMILY</small></>}
      {asset.previewKind === "video" && <span className={styles.playMark} aria-hidden="true">▶</span>}
      {asset.previewKind === "audio" && <><span className={styles.waveform} aria-hidden="true" /><small>AUDIO SIGNATURE</small></>}
      {asset.previewKind === "template" && <><span className={styles.templateEyebrow}>THE LUXE / STUDIO</span><strong>Make room<br />for the work.</strong><span className={styles.templateFooter}>YOUR NEXT BIG IDEA</span></>}
      {asset.previewKind === "document" && <><span className={styles.documentMark}>{asset.format}</span><small>{asset.name}</small></>}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BrandAssetsPage() {
  const [category, setCategory] = useState<CategoryFilter>("All assets");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<AssetViewMode>("grid");
  const [selectedAsset, setSelectedAsset] = useState<BrandKitAsset | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<readonly { id: string; name: string; size: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const assets = mockBrandAssetKit.assets.filter((asset) => {
    const matchesCategory = category === "All assets" || asset.category === category;
    const matchesQuery = `${asset.name} ${asset.category} ${asset.format}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  function queueFiles(files: FileList | File[]) {
    setQueuedFiles((current) => [
      ...current,
      ...Array.from(files, (file, index) => ({
        id: `${file.name}-${file.lastModified}-${current.length + index}`,
        name: file.name,
        size: formatBytes(file.size),
      })),
    ]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    queueFiles(event.dataTransfer.files);
  }

  return (
    <div className={styles.page}>
      <StageFlowNavigation currentStep="brand-asset-kit" />

      <header className={styles.header}>
        <div>
          <p className="luxe-eyebrow">STAGE 1 / STEP 5 <Badge className={styles.previewLabel} variant="pending">Concept preview</Badge></p>
          <h1 className="stage-flow-title">Brand Asset Kit</h1>
          <p className="stage-flow-caption">A considered home for the visual pieces behind your brand.</p>
        </div>
        <Button className={styles.addButton} onClick={() => fileInput.current?.click()} type="button" variant="primary">
          <span aria-hidden="true">＋</span> Add assets
        </Button>
        <input
          ref={fileInput}
          aria-label="Choose asset files"
          className={styles.fileInput}
          multiple
          onChange={(event) => {
            queueFiles(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
          }}
          type="file"
        />
      </header>

      <section aria-label="Library overview" className={styles.overview}>
        <Card aria-label="Storage summary" className={styles.storagePanel} padding="md">
          <div className={styles.panelHeading}>
            <div><p className={styles.panelEyebrow}>WORKSPACE STORAGE</p><h2>{mockBrandAssetKit.storageUsedLabel} <span>of {mockBrandAssetKit.storageLimitLabel}</span></h2></div>
            <span className={styles.storagePercent}>{mockBrandAssetKit.storageUsedPercent}%</span>
          </div>
          <div
            aria-label="Storage used"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={mockBrandAssetKit.storageUsedPercent}
            className={styles.progressTrack}
            role="progressbar"
          ><span style={{ width: `${mockBrandAssetKit.storageUsedPercent}%` }} /></div>
          <p className={styles.mutedLine}>A sample workspace overview. Storage is not connected.</p>
        </Card>
        <Card className={styles.statPanel} padding="md"><span className={styles.statIcon} aria-hidden="true">▤</span><div><p className={styles.panelEyebrow}>LIBRARY</p><strong>{mockBrandAssetKit.assets.length} assets</strong><span>Across five categories</span></div></Card>
        <Card className={styles.statPanel} padding="md"><span className={styles.statIcon} aria-hidden="true">✦</span><div><p className={styles.panelEyebrow}>RECENTLY ADDED</p><strong>Brand Guidelines</strong><span>Updated Oct 30</span></div></Card>
      </section>

      <Card aria-labelledby="library-heading" className={styles.library} padding="md">
        <div className={styles.sectionHeading}>
          <div><p className={styles.panelEyebrow}>YOUR WORKSPACE</p><h2 id="library-heading">Asset library</h2></div>
          <label className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <SearchInput aria-label="Search assets" onChange={(event) => setQuery(event.target.value)} placeholder="Search assets..." value={query} />
          </label>
        </div>

        <Tabs
          ariaLabel="Filter assets by category"
          className={styles.filters}
          items={categories.map((item) => {
            const count = item === "All assets" ? mockBrandAssetKit.assets.length : mockBrandAssetKit.assets.filter((asset) => asset.category === item).length;
            return { value: item, label: `${item} ${count}` };
          })}
          onValueChange={(value) => setCategory(value as CategoryFilter)}
          value={category}
        />

        <div className={styles.resultsHeading}>
          <h3>{category === "All assets" ? "Recently added" : category}</h3><span>{assets.length} items</span>
          <div className={styles.viewControls} role="group" aria-label="Asset view">
            <Button aria-label="Grid view" aria-pressed={viewMode === "grid"} className={styles.viewButton} onClick={() => setViewMode("grid")} size="sm" type="button" variant="icon">▦</Button>
            <Button aria-label="List view" aria-pressed={viewMode === "list"} className={styles.viewButton} onClick={() => setViewMode("list")} size="sm" type="button" variant="icon">☷</Button>
          </div>
        </div>
        {assets.length && viewMode === "grid" ? (
          <div className={styles.assetGrid}>
            {assets.map((asset) => (
              <button aria-label={asset.name} className={styles.assetCard} key={asset.id} onClick={() => setSelectedAsset(asset)} type="button">
                <AssetArtwork asset={asset} />
                <span className={styles.assetDetails}><span><strong>{asset.name}</strong><small>{asset.format} · {asset.sizeLabel}</small></span><span className={styles.moreMark} aria-hidden="true">···</span></span>
                <Badge className={styles.categoryLabel} variant="neutral">{asset.category}</Badge>
              </button>
            ))}
          </div>
        ) : assets.length ? (
          <Table aria-label="Asset list" className={styles.assetTable}>
            <TableCaption className={styles.visuallyHidden}>Brand assets matching the current filters</TableCaption>
            <TableHeader><TableRow><TableHead scope="col">Name</TableHead><TableHead scope="col">Category</TableHead><TableHead scope="col">Type</TableHead><TableHead scope="col">Size</TableHead></TableRow></TableHeader>
            <TableBody>{assets.map((asset) => <TableRow key={asset.id}><TableCell><Button className={styles.tableAssetButton} onClick={() => setSelectedAsset(asset)} type="button" variant="ghost">{asset.name}</Button></TableCell><TableCell>{asset.category}</TableCell><TableCell>{asset.format}</TableCell><TableCell>{asset.sizeLabel}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <p className={styles.emptyState}>No assets match this search.</p>}
      </Card>

      <section aria-label="Upload assets" className={styles.uploadZone} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} role="region">
        <span className={styles.uploadMark} aria-hidden="true">↥</span>
        <div><h2 id="upload-heading">Bring your brand materials together</h2><p>Drop files here, or <button className={styles.inlineAction} onClick={() => fileInput.current?.click()} type="button">browse files</button></p><small>Images, fonts, documents, and templates</small></div>
        {queuedFiles.length > 0 && <div aria-live="polite" className={styles.queuedList}><strong>Queued in this preview only</strong>{queuedFiles.map((file) => <span key={file.id}>{file.name} <small>{file.size}</small></span>)}</div>}
      </section>

      <p className={styles.conceptNote}>This concept preview is not connected to storage. Files you add stay in this page only and are not saved.</p>

      {selectedAsset && (
        <>
          <button aria-label="Close asset preview" className={styles.drawerBackdrop} onClick={() => setSelectedAsset(null)} type="button" />
          <aside aria-label="Asset preview" className={styles.drawer} role="complementary">
            <div className={styles.drawerHeading}><div><p className={styles.panelEyebrow}>QUICK REVIEW</p><h2>{selectedAsset.name}</h2></div><Button aria-label="Close preview" className={styles.closeButton} onClick={() => setSelectedAsset(null)} size="sm" type="button" variant="icon">×</Button></div>
            <AssetArtwork asset={selectedAsset} large />
            <p className={styles.drawerDescription}>{selectedAsset.description}</p>
            <dl className={styles.metadata}>
              <div><dt>Category</dt><dd>{selectedAsset.category}</dd></div>
              <div><dt>File type</dt><dd>{selectedAsset.format}</dd></div>
              <div><dt>File size</dt><dd>{selectedAsset.sizeLabel}</dd></div>
              <div><dt>Last updated</dt><dd>{new Date(selectedAsset.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</dd></div>
            </dl>
            <div className={styles.rightsNote}><span aria-hidden="true">ⓘ</span><p>Confirm usage rights before sharing brand materials outside this workspace.</p></div>
            <p className={styles.conceptNote}>Sample asset details. This library is not connected to saved files.</p>
          </aside>
        </>
      )}

      <StageFlowFooter prevRoute={APP_ROUTES.pocsBrandKit} currentStep={5} totalSteps={5} completeStep="brand-asset-kit" nextRoute={APP_ROUTES.pocsImportWorld} />
    </div>
  );
}