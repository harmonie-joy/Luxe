import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type RequiredSection = {
  file: string;
  sections: string[];
};

const ROOT = process.cwd();

const REQUIRED: RequiredSection[] = [
  {
    file: "docs/00_PROJECT_BRIEF.md",
    sections: [
      "## Project Name",
      "## One-Sentence Description",
      "## Problem",
      "## Target Users",
      "## Core Features",
      "## Current Stage",
      "## Current Priority",
      "## Non-Goals",
      "## Important Constraints",
    ],
  },
  {
    file: "docs/01_ARCHITECTURE.md",
    sections: [
      "## Tech Stack",
      "## Main Modules",
      "## Data Flow",
      "## Important Design Rules",
    ],
  },
  {
    file: "docs/02_DECISIONS.md",
    sections: ["# Technical Decisions", "## Decision Log"],
  },
  {
    file: "docs/04_NEXT_ACTIONS.md",
    sections: [
      "## Current Sprint Goal",
      "## Active Tasks",
      "## Blockers",
      "## Best Next Task for AI",
      "## Do Not Touch Yet",
    ],
  },
];

function validateFile(file: RequiredSection): string[] {
  const path = join(ROOT, file.file);
  const issues: string[] = [];

  if (!existsSync(path)) {
    return [`Missing file: ${file.file}`];
  }

  const content = readFileSync(path, "utf8");

  for (const section of file.sections) {
    if (!content.includes(section)) {
      issues.push(`Missing section in ${file.file}: ${section}`);
    }
  }

  return issues;
}

function main(): void {
  const issues = REQUIRED.flatMap(validateFile);

  if (issues.length === 0) {
    console.log("Project memory validation passed.");
    return;
  }

  console.error("Project memory validation failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  process.exit(1);
}

main();