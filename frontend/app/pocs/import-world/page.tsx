"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { mockImportWorld, type ImportWorldConnectorId } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";

export default function ImportWorldPage() {
  const [step, setStep] = useState(0);
  const [connectedSources, setConnectedSources] = useState<ImportWorldConnectorId[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["brand", "content", "strategy"]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step !== 2 || progress >= 100) return;

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 5, 100));
    }, 180);

    return () => window.clearInterval(timer);
  }, [progress, step]);

  const totalItems = mockImportWorld.connectors
    .filter((connector) => connectedSources.includes(connector.id))
    .reduce((total, connector) => total + connector.sampleCount, 0);

  const nextStep = () => {
    if (step < mockImportWorld.steps.length - 1) setStep((current) => current + 1);
  };

  const toggleSource = (sourceId: ImportWorldConnectorId) => {
    setConnectedSources((current) => current.includes(sourceId)
      ? current.filter((id) => id !== sourceId)
      : [...current, sourceId]);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  };

  const activeStep = mockImportWorld.steps[step];

  return (
    <div className="import-world">
      <header className="import-world-header">
        <div>
          <p className="luxe-eyebrow">PHASE 1 · BUILD · PAGE 7</p>
          <h1 className="stage-flow-title">Import My World</h1>
          <p className="stage-flow-caption">Bring your existing creative work together, in one considered place.</p>
        </div>
        <Badge variant="neutral">Preview · synthetic data</Badge>
      </header>

      <ol aria-label="Import progress" className="import-world-steps">
        {mockImportWorld.steps.map((item, index) => {
          const status = index < step ? "Complete" : index === step ? "In progress" : "Upcoming";
          return (
            <li aria-current={index === step ? "step" : undefined} className="import-world-step" key={item.id}>
              <span aria-hidden="true" className="import-world-step-number">{index < step ? "✓" : index + 1}</span>
              <span className="import-world-step-copy">
                <strong>{item.label}</strong>
                <span>{status}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="import-world-layout">
        <Card aria-labelledby="import-world-active-title" className="import-world-main" padding="md">
          <div className="import-world-panel-heading">
            <div>
              <Badge variant="active">Step {step + 1} of {mockImportWorld.steps.length}</Badge>
              <h2 id="import-world-active-title">{step === 2 ? "We organize it for you" : activeStep.label}</h2>
              <p>{activeStep.description}</p>
            </div>
            {step < 4 && <span aria-hidden="true" className="import-world-heading-mark">✦</span>}
          </div>

          {step === 0 && (
            <div aria-label="Available sources" className="import-world-connectors">
              {mockImportWorld.connectors.map((connector) => {
                const isConnected = connectedSources.includes(connector.id);
                return (
                  <article className={`import-world-connector${isConnected ? " is-connected" : ""}`} key={connector.id}>
                    <span aria-hidden="true" className="import-world-connector-mark">{connector.mark}</span>
                    <div className="import-world-connector-copy">
                      <strong>{connector.name}</strong>
                      <span>{connector.description}</span>
                    </div>
                    <Badge variant={isConnected ? "active" : "neutral"}>{isConnected ? "Connected" : connector.kind}</Badge>
                    <Button
                      aria-pressed={isConnected}
                      onClick={() => toggleSource(connector.id)}
                      type="button"
                      variant={isConnected ? "secondary" : "outline"}
                    >
                      {isConnected ? "Disconnect" : `Connect ${connector.name}`}
                    </Button>
                  </article>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <fieldset className="import-world-categories">
              <legend>What would you like to bring in?</legend>
              {mockImportWorld.categories.map((category) => (
                <label className="import-world-category" key={category.id}>
                  <input
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    type="checkbox"
                  />
                  <span className="import-world-category-copy">
                    <strong>{category.name}</strong>
                    <span>{category.description}</span>
                  </span>
                  <span className="import-world-category-count">{category.sampleCount}</span>
                </label>
              ))}
            </fieldset>
          )}

          {step === 2 && (
            <div className="import-world-organizing">
              <div aria-label="Categorization progress" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="import-world-progress" role="progressbar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="import-world-progress-label" role="status">{progress === 100 ? "Organization complete" : `Organizing your content… ${progress}%`}</p>
              <ul className="import-world-task-list">
                {mockImportWorld.organizingTasks.map((task, index) => {
                  const complete = progress >= (index + 1) * 25;
                  return <li key={task}><span aria-hidden="true">{complete ? "✓" : "○"}</span>{task}<Badge variant={complete ? "active" : "pending"}>{complete ? "Ready" : "Working"}</Badge></li>;
                })}
              </ul>
              <p className="import-world-note">This is a local preview. No connected account or content is accessed.</p>
            </div>
          )}

          {step === 3 && (
            <div className="import-world-review">
              <p>Here is a preview of the {totalItems.toLocaleString()} sample items from {connectedSources.length} connected {connectedSources.length === 1 ? "source" : "sources"}.</p>
              {selectedCategories.length > 0 ? (
                <ul>{mockImportWorld.categories.filter((category) => selectedCategories.includes(category.id)).map((category) => <li key={category.id}><span>{category.name}</span><strong>{category.sampleCount.toLocaleString()} items</strong></li>)}</ul>
              ) : <p>Select at least one content category to continue.</p>}
              <p className="import-world-note">Nothing will be uploaded or saved. This prototype only demonstrates the review flow.</p>
            </div>
          )}

          {step === 4 && (
            <div className="import-world-complete" role="status">
              <span aria-hidden="true" className="import-world-complete-mark">✓</span>
              <h3>Your world is connected</h3>
              <p>{connectedSources.length} sources and {totalItems.toLocaleString()} sample items are ready in this preview.</p>
              <p className="import-world-note">No real accounts, files, or creator data were accessed or stored.</p>
            </div>
          )}

          <div className="import-world-actions">
            <span className="import-world-step-caption">{step < 4 ? `Step ${step + 1} / 5` : "Preview complete"}</span>
            {step < 4 && (
              <Button
                disabled={(step === 0 && connectedSources.length === 0) || (step === 1 && selectedCategories.length === 0) || (step === 2 && progress < 100)}
                onClick={nextStep}
                type="button"
              >
                {step === 3 ? "Finish preview" : step === 1 ? "Organize content" : "Continue"} <span aria-hidden="true">→</span>
              </Button>
            )}
          </div>
        </Card>

        <aside className="import-world-aside">
          <Card aria-labelledby="import-world-summary-title" className="import-world-summary" padding="md">
            <h2 id="import-world-summary-title">Import overview</h2>
            <p>Sources selected</p>
            <strong className="import-world-summary-value">{connectedSources.length}</strong>
            <div className="import-world-summary-divider" />
            <p>Sample items available</p>
            <strong className="import-world-summary-value">{totalItems.toLocaleString()}</strong>
            <ul>{mockImportWorld.connectors.filter((connector) => connectedSources.includes(connector.id)).map((connector) => <li key={connector.id}><span>{connector.name}</span><span>{connector.sampleCount.toLocaleString()}</span></li>)}</ul>
            {connectedSources.length === 0 && <p className="import-world-empty">Connect a source to see its sample count.</p>}
          </Card>
          <Card className="import-world-safety" padding="sm">
            <Badge variant="pending">Preview only</Badge>
            <p>Connect buttons update this mock screen only. Real provider access and import are not enabled.</p>
          </Card>
        </aside>
      </div>
      <StageFlowFooter
        currentStep={1}
        nextDisabled={step < 4}
        nextHint={step < 4 ? "Finish the import preview to continue." : undefined}
        nextLabel="Open Tornado Workspace"
        nextRoute={APP_ROUTES.pocsTornadoWorkspace}
        prevRoute={APP_ROUTES.pocsBrandAssetKit}
        totalSteps={5}
      />
    </div>
  );
}