"use client";

import { useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Card, type CardPadding } from "@/components/ui/card";
import { Input, SearchInput, Select } from "@/components/ui/input";
import { StatusIndicator, type StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";

const buttonVariants: readonly ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "icon"];
const buttonSizes: readonly ButtonSize[] = ["sm", "md", "lg"];
const badgeVariants: readonly BadgeVariant[] = ["active", "pending", "alert", "neutral"];
const cardPaddings: readonly CardPadding[] = ["none", "sm", "md", "lg"];
const statusTones: readonly StatusIndicatorTone[] = ["primary", "neutral", "critical", "warning", "success", "info"];
const tabItems = [
  { value: "drafts", label: "Drafts" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled", disabled: true },
];

export default function ComponentGallery() {
  const [activeTab, setActiveTab] = useState("drafts");
  const [buttonClicks, setButtonClicks] = useState(0);

  return (
    <>
      <h1>Component Gallery</h1>

      <section aria-labelledby="buttons-heading" className="luxe-pocs-section">
        <h2 id="buttons-heading">Buttons</h2>
        <div className="luxe-pocs-stack">
          {buttonVariants.map((variant) => (
            <div className="luxe-pocs-stack" key={variant}>
              <h3>{variant}</h3>
              {buttonSizes.map((size) => (
                <div className="luxe-pocs-row" key={size}>
                  <span className="luxe-pocs-muted">{size}</span>
                  <Button aria-label={variant === "icon" ? `Add item ${size}` : undefined} onClick={() => setButtonClicks((count) => count + 1)} size={size} title={variant === "icon" ? "Add item" : undefined} type="button" variant={variant}>
                    {variant === "icon" ? "+" : "Default"}
                  </Button>
                  <Button aria-label={variant === "icon" ? `Disabled add item ${size}` : undefined} disabled size={size} title="Disabled" type="button" variant={variant}>
                    {variant === "icon" ? "+" : "Disabled"}
                  </Button>
                  <Button aria-busy="true" aria-label={variant === "icon" ? `Adding item ${size}` : undefined} disabled size={size} title="Loading" type="button" variant={variant}>
                    {variant === "icon" ? "…" : "Loading…"}
                  </Button>
                </div>
              ))}
            </div>
          ))}
          <output aria-live="polite" className="luxe-pocs-muted">Button activations: {buttonClicks}</output>
        </div>
      </section>

      <section aria-labelledby="inputs-heading" className="luxe-pocs-section">
        <h2 id="inputs-heading">Inputs</h2>
        <div className="luxe-pocs-grid">
          <label className="luxe-pocs-field">Default<Input placeholder="Project title" /></label>
          <label className="luxe-pocs-field">Filled<Input defaultValue="Studio launch" /></label>
          <label className="luxe-pocs-field">Disabled<Input defaultValue="Unavailable" disabled /></label>
          <label className="luxe-pocs-field">Read only<Input defaultValue="Approved version" readOnly /></label>
          <div className="luxe-pocs-field"><label htmlFor="invalid-title">Invalid</label><Input aria-describedby="title-error" aria-invalid="true" defaultValue="" id="invalid-title" required /><span className="luxe-pocs-error" id="title-error">A title is required.</span></div>
          <label className="luxe-pocs-field">Search<SearchInput placeholder="Search projects" /></label>
          <label className="luxe-pocs-field">Disabled search<SearchInput disabled placeholder="Search unavailable" /></label>
          <label className="luxe-pocs-field">Channel<Select defaultValue="linkedin"><option value="linkedin">LinkedIn</option><option value="newsletter">Newsletter</option><option disabled value="instagram">Instagram (unavailable)</option></Select></label>
          <label className="luxe-pocs-field">Disabled select<Select disabled><option>Unavailable</option></Select></label>
          <div className="luxe-pocs-field"><label htmlFor="invalid-channel">Invalid select</label><Select aria-describedby="channel-error" aria-invalid="true" defaultValue="" id="invalid-channel" required><option disabled value="">Choose a channel</option><option value="linkedin">LinkedIn</option></Select><span className="luxe-pocs-error" id="channel-error">Choose a channel.</span></div>
        </div>
      </section>

      <section aria-labelledby="cards-heading" className="luxe-pocs-section">
        <h2 id="cards-heading">Cards</h2>
        <div className="luxe-pocs-grid">
          {cardPaddings.map((padding) => (
            <Card key={padding} padding={padding}>
              <div className="luxe-pocs-card-content" data-unpadded={padding === "none" ? "" : undefined}>
                <h3>Padding: {padding}</h3><span className="luxe-pocs-muted">Studio launch</span><Badge variant="pending">In review</Badge>
              </div>
            </Card>
          ))}
        </div>
        <h3 className="luxe-pocs-panel">SurfaceCard</h3>
        <div className="luxe-pocs-grid">
          {(["none", "sm", "md"] as const).map((padding) => (
            <SurfaceCard key={padding} padding={padding}>
              <div className="luxe-pocs-card-content" data-unpadded={padding === "none" ? "" : undefined}><h3>Padding: {padding}</h3><span className="luxe-pocs-muted">Creator workspace</span></div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="badges-heading" className="luxe-pocs-section">
        <h2 id="badges-heading">Badges</h2>
        <div className="luxe-pocs-row">{badgeVariants.map((variant) => <Badge key={variant} variant={variant}>{variant}</Badge>)}</div>
        <h3 className="luxe-pocs-panel">StatusIndicator</h3>
        <div className="luxe-pocs-stack">
          {[false, true].map((uppercase) => <div className="luxe-pocs-row" key={String(uppercase)}>{statusTones.map((tone) => <StatusIndicator key={tone} label={tone} tone={tone} uppercase={uppercase} />)}</div>)}
        </div>
      </section>

      <section aria-labelledby="tables-heading" className="luxe-pocs-section">
        <h2 id="tables-heading">Tables</h2>
        <div className="luxe-pocs-stack">
          <Table>
            <TableCaption>Sample content queue</TableCaption>
            <TableHeader><TableRow><TableHead scope="col">Project</TableHead><TableHead scope="col">Channel</TableHead><TableHead scope="col">Status</TableHead></TableRow></TableHeader>
            <TableBody>{badgeVariants.map((variant) => <TableRow key={variant}><TableCell>Studio launch / {variant}</TableCell><TableCell>LinkedIn</TableCell><TableCell><Badge variant={variant}>{variant}</Badge></TableCell></TableRow>)}</TableBody>
          </Table>
          <Table>
            <TableCaption>Empty queue</TableCaption>
            <TableHeader><TableRow><TableHead scope="col">Project</TableHead><TableHead scope="col">Status</TableHead></TableRow></TableHeader>
            <TableBody><TableRow><TableCell colSpan={2}>No content items.</TableCell></TableRow></TableBody>
          </Table>
          <Table aria-busy="true">
            <TableCaption>Loading queue</TableCaption>
            <TableHeader><TableRow><TableHead scope="col">Project</TableHead><TableHead scope="col">Status</TableHead></TableRow></TableHeader>
            <TableBody><TableRow><TableCell colSpan={2}>Loading content…</TableCell></TableRow></TableBody>
          </Table>
        </div>
      </section>

      <section aria-labelledby="tabs-heading" className="luxe-pocs-section">
        <h2 id="tabs-heading">Tabs</h2>
        <Tabs ariaLabel="Content status" items={tabItems} onValueChange={setActiveTab} value={activeTab} />
        <div aria-label={tabItems.find((item) => item.value === activeTab)?.label} className="luxe-pocs-panel" role="tabpanel" tabIndex={0}>
          {activeTab === "drafts" ? "2 drafts awaiting review." : "No approved content yet."}
        </div>
      </section>
    </>
  );
}