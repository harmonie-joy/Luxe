"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, SearchInput, Select } from "@/components/ui/input";
import { type InspirationItem, type mockAestheticBoard } from "@/lib/mock-data/pocs-data";
import styles from "./board.module.css";

export function AestheticBoard({ data }: { data: typeof mockAestheticBoard }) {
  const [items, setItems] = useState<readonly InspirationItem[]>(data.items);
  const [category, setCategory] = useState("All Inspiration");
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);
  const [selected, setSelected] = useState<InspirationItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState("masonry");
  const [announcement, setAnnouncement] = useState("");
  const visible = items.filter((item) =>
    (category === "All Inspiration" || (category === "Pinned" ? pinned.includes(item.id) : item.category === category)) &&
    (!tag || item.tags.includes(tag)) &&
    `${item.title} ${item.note} ${item.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase().trim()),
  );

  function resetFilters() {
    setCategory("All Inspiration");
    setTag("");
    setSearch("");
  }

  function togglePin(item: InspirationItem) {
    const alreadyPinned = pinned.includes(item.id);
    setPinned((current) => alreadyPinned ? current.filter((id) => id !== item.id) : [...current, item.id]);
    setAnnouncement(`${item.title} ${alreadyPinned ? "unpinned" : "pinned"}.`);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>YOUR CREATIVE COLLECTION</p>
          <h1>Aesthetic &amp; Inspiration Board</h1>
          <p className={styles.subtitle}>Collect what inspires you. Create your own version.</p>
        </div>
        <Button onClick={() => setAdding(true)}><span aria-hidden="true">+</span> Add inspiration</Button>
      </header>

      <div className={styles.context}>
        <Badge>Sample board</Badge>
        <span>Visual inspiration, not established brand rules.</span>
        <span className={styles.localNotice}>Changes last only for this visit.</span>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Inspiration categories" onKeyDown={(event) => {
        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
        const index = tabs.findIndex((tab) => tab === document.activeElement);
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        tabs[next].click();
      }}>
        {["All Inspiration", ...data.categories, "Pinned"].map((name) => (
          <Button key={name} id={`category-${name.replaceAll(" ", "-")}`} role="tab" tabIndex={category === name ? 0 : -1} aria-selected={category === name} aria-controls="inspiration-results" variant="ghost" size="sm" onClick={() => setCategory(name)}>{name}</Button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.tagLabel}>Tag
          <Select aria-label="Filter by tag" value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">All tags</option>
            {data.tags.map((name) => <option key={name}>{name}</option>)}
          </Select>
        </label>
        <SearchInput aria-label="Search inspiration" placeholder="Search inspiration..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className={styles.viewControls} role="group" aria-label="Board layout">
          <Button variant="icon" title="Masonry view" aria-label="Masonry view" aria-pressed={view === "masonry"} onClick={() => setView("masonry")}><span aria-hidden="true">&#9636;</span></Button>
          <Button variant="icon" title="Grid view" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><span aria-hidden="true">&#9638;</span></Button>
        </div>
      </div>

      <section id="inspiration-results" role="tabpanel" aria-labelledby={`category-${category.replaceAll(" ", "-")}`} className={styles.collection}>
        <div className={styles.results}><span>{visible.length} inspirations</span><span>{pinned.length} pinned</span></div>
        {visible.length ? (
          <div className={view === "masonry" ? styles.masonry : styles.grid}>
            {visible.map((item) => (
              <Card padding="none" key={item.id} className={styles.tile}>
                <button className={styles.openCard} aria-label={`Open ${item.title}`} onClick={() => setSelected(item)}>
                  <InspirationVisual item={item} />
                </button>
                <div className={styles.caption}>
                  <div><h2>{item.title}</h2><p>{item.category}</p></div>
                  <Button variant="icon" size="sm" aria-label={`${pinned.includes(item.id) ? "Unpin" : "Pin"} ${item.title}`} title={pinned.includes(item.id) ? "Unpin inspiration" : "Pin inspiration"} aria-pressed={pinned.includes(item.id)} onClick={() => togglePin(item)}><span aria-hidden="true">{pinned.includes(item.id) ? "\u2665" : "\u2661"}</span></Button>
                </div>
              </Card>
            ))}
          </div>
        ) : <div className={styles.empty}><h2>No inspiration found</h2><p>Try a different search or collect something new.</p><Button variant="outline" onClick={resetFilters}>Clear filters</Button></div>}
      </section>

      <footer className={styles.footer}><span>YOUR POINT OF VIEW, TAKING SHAPE</span><p>A starting point for something distinctly yours.</p></footer>
      <p className={styles.srOnly} role="status">{announcement}</p>

      {selected && <BoardDialog title={selected.title} onClose={() => setSelected(null)}>
        <InspirationVisual item={selected} />
        <p className={styles.detailNote}>{selected.note}</p>
        <div className={styles.tags}>{selected.tags.map((name) => <Badge key={name}>{name}</Badge>)}</div>
        <Button variant="outline" onClick={() => togglePin(selected)}>{pinned.includes(selected.id) ? "Unpin inspiration" : "Pin inspiration"}</Button>
      </BoardDialog>}

      {adding && <BoardDialog title="Add inspiration" onClose={() => setAdding(false)}>
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const title = String(form.get("title") ?? "").trim();
          const note = String(form.get("note") ?? "").trim();
          if (!title || !note) return;
          setItems((current) => [{ id: `inspiration-local-${crypto.randomUUID()}`, title, note, category: "Mood & Vibe", tags: [], sample: title }, ...current]);
          resetFilters();
          setAdding(false);
          setAnnouncement(`${title} added to this sample board for this visit.`);
        }}>
          <p className={styles.subtitle}>A personal reference for this visit, not a saved brand rule.</p>
          <label>Title<Input name="title" required maxLength={100} /></label>
          <label>Inspiration note<textarea name="note" required maxLength={1000} rows={4} className="luxe-ui-input" /></label>
          <Button type="submit">Add to board</Button>
        </form>
      </BoardDialog>}
    </div>
  );
}

function InspirationVisual({ item }: { item: InspirationItem }) {
  if (item.image) return <div className={styles.imageWrap}>
    <Image src={item.image} alt={item.alt ?? item.title} width={600} height={750} unoptimized />
    {item.category === "Videos" && <span className={styles.mediaLabel}>Storyboard reference</span>}
  </div>;
  if (item.swatches) return <div className={styles.palette}><div className={styles.swatches}>{item.swatches.map((swatch) => <span key={swatch.name} title={swatch.name} aria-label={swatch.name} style={{ backgroundColor: `var(${swatch.token})` }} />)}</div><span>THE SEASONAL EDIT</span></div>;
  return <div className={`${styles.typeSample} ${item.category === "Typography" ? styles.letterSample : ""}`}><span>{item.category === "Typography" ? "TYPE STUDY / 01" : item.category.toUpperCase()}</span><strong>{item.sample}</strong><span>{item.category === "Typography" ? "Serif & sans / an editorial pairing" : "A LITTLE SPACE TO THINK BIGGER"}</span></div>;
}

function BoardDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      if (event.key === "Tab") {
        const controls = ref.current?.querySelectorAll<HTMLElement>("button, input, textarea, select, [href]");
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <div className={styles.dialogHeader}><h2>{title}</h2><Button variant="icon" aria-label="Close dialog" title="Close dialog" onClick={onClose}>&#215;</Button></div>
      {children}
    </div>
  </div>;
}