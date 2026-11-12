"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import type { mockTornadoWorkspace as TornadoWorkspaceData } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import styles from "../tornado-workspace/page.module.css";

interface TornadoWorkspaceProps {
  data: typeof TornadoWorkspaceData;
}

const commandItems = ["Home", "Projects", "Tasks", "Content", "Knowledge hub", "Calendar", "Analytics"];

export function TornadoWorkspace({ data }: TornadoWorkspaceProps) {
  const [completedItems, setCompletedItems] = useState<readonly string[]>([]);

  const toggleFocus = (id: string) => {
    setCompletedItems((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>PHASE 1 / BUILD / PAGE 8</p>
          <h1 className="stage-flow-title">The Tornado</h1>
          <p className="stage-flow-caption">From scattered creative work to a workspace that is ready for you.</p>
        </div>
        <Badge variant="neutral">Preview / synthetic data</Badge>
      </header>

      <div className={styles.workspaceGrid}>
        <section aria-labelledby="transition-title" className={styles.transitionPanel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>CHAOS TO CLARITY</p>
              <h2 id="transition-title">Everything finds its place.</h2>
              <p>Loose notes, saved posts, and brand files come together around your work.</p>
            </div>
            <span aria-hidden="true" className={styles.transitionMark}>*</span>
          </div>

          <div aria-label="Illustration of creative assets being organized into collections" className={styles.transitionGraphic} role="img">
            <div className={styles.sourceField}>
              <span className={styles.graphicLabel}>SCATTERED</span>
              {data.scatteredAssets.map((asset, index) => (
                <span className={`${styles.assetTile} ${styles[`assetPosition${index + 1}`]}`} key={asset.id}>
                  <span aria-hidden="true" className={styles.assetMark}>{asset.mark}</span>
                  <span className={styles.assetCopy}><strong>{asset.name}</strong><small>{asset.source}</small></span>
                </span>
              ))}
            </div>
            <div aria-hidden="true" className={styles.vortex}>
              <span className={styles.vortexRing} />
              <span className={styles.vortexRing} />
              <span className={styles.vortexCore}>*</span>
            </div>
            <div className={styles.collectionField}>
              <span className={styles.graphicLabel}>ORGANIZED</span>
              {data.collections.map((collection, index) => (
                <span className={styles.collectionTile} key={collection}>
                  <span aria-hidden="true" className={styles.collectionMark}>{["B", "S", "C"][index]}</span>
                  <span>{collection}</span>
                </span>
              ))}
            </div>
            <span aria-hidden="true" className={styles.flowLine} />
          </div>

          <div className={styles.transitionFooter}>
            <span className={styles.footerMark} aria-hidden="true">*</span>
            <p>Your creative world, ready to work with you.</p>
            <span className={styles.footerCount}>{data.scatteredAssets.length} sample sources</span>
          </div>
        </section>

        <section aria-labelledby="command-title" className={styles.commandPanel}>
          <header className={styles.commandHeader}>
            <div className={styles.brandLockup}>
              <span aria-hidden="true" className={styles.brandMark}>*</span>
              <div><strong>TORANDO</strong><span>CREATIVE WORKSPACE</span></div>
            </div>
            <Badge variant="neutral">Sample workspace</Badge>
          </header>

          <div className={styles.commandBody}>
            <nav aria-label="Command center" className={styles.commandNav}>
              {commandItems.map((item, index) => (
                <span aria-current={index === 0 ? "page" : undefined} className={styles.navItem} key={item}>
                  <span aria-hidden="true" className={styles.navMark}>{["H", "P", "T", "C", "K", "D", "A"][index]}</span>
                  {item}
                </span>
              ))}
              <span className={styles.profile}><span aria-hidden="true">H</span>{data.creatorName}<small>Creator</small></span>
            </nav>

            <div className={styles.dashboard}>
              <div className={styles.greeting}>
                <div>
                  <p className={styles.eyebrow}>THURSDAY, NOVEMBER 5</p>
                  <h2 id="command-title">Good morning, {data.creatorName}.</h2>
                  <p>A little more clarity for today&apos;s work.</p>
                </div>
                <span aria-hidden="true" className={styles.sparkle}>*</span>
              </div>

              <section aria-label="Workspace metrics" className={styles.metrics}>
                {data.metrics.map((metric) => (
                  <article className={styles.metric} key={metric.id}>
                    <span className={styles.metricMark} aria-hidden="true">{metric.mark}</span>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <span className={styles.metricDetail}>{metric.detail}</span>
                  </article>
                ))}
              </section>

              <section aria-labelledby="focus-title" className={styles.focusPanel}>
                <div className={styles.focusHeading}>
                  <div><p className={styles.eyebrow}>YOUR NEXT SMALL WINS</p><h3 id="focus-title">Today&apos;s Focus</h3></div>
                  <span className={styles.focusProgress}>{completedItems.length}/{data.focus.length} done</span>
                </div>
                <ul className={styles.focusList}>
                  {data.focus.map((item) => {
                    const isComplete = completedItems.includes(item.id);
                    return (
                      <li className={styles.focusItem} data-complete={isComplete} key={item.id}>
                        <label>
                          <input checked={isComplete} onChange={() => toggleFocus(item.id)} type="checkbox" />
                          <span className={styles.checkmark} aria-hidden="true" />
                          <span className={styles.focusCopy}><strong>{item.title}</strong><small>{item.category}</small></span>
                        </label>
                        <span className={styles.focusDue}>{item.due}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <p className={styles.demoNote}>Illustrative workspace only. No external accounts are connected.</p>
            </div>
          </div>
        </section>
      </div>
      <StageFlowFooter
        currentStep={2}
        nextLabel="Open Content Workspace"
        nextRoute={APP_ROUTES.pocsContentWorkspace}
        prevRoute={APP_ROUTES.pocsImportWorld}
        totalSteps={5}
      />
    </div>
  );
}