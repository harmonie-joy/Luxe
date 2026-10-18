# Creator/CEO UX baseline

Revision 1 · recorded 2026-10-18 · PR #59 merged at `c6d3e44`; founder acceptance of larger typography, taller cards and mobile navigation remains pending. Merge alone is not design sign-off.

## Authority and private source

1. **Product and technical delivery:** `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx`, dated 2026-08-10, founder-confirmed 2026-10-16. Governs MVP capabilities, delivery/release gates, privacy/compliance and technical boundaries. Verified local SHA-256: `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`.
2. **UX direction:** *THE LUXE — Mario Builder Spec with UX/UI Mockup Slots*, cover dated 2026-08-06, confidential. Governs page hierarchy, journeys, interaction direction and visual references within the product scope above.
3. **Implementation evidence:** [#58](https://github.com/harmonie-joy/Luxe/issues/58), scoped issues, source/API contracts, tests, browser captures and reviewed PRs demonstrate implementation; they do not redefine either authority.

Verified PDF SHA-256:

`2c3da43ba956fb8994614117a38f7120295af427515af8f4638789b30ce65743`

The verified accessible source is `/home/mario/the-luxe/theluxe/temp/THE_LUXE_Mario_Spec.pdf.pdf` (72 physical pages; PDF title `THE_LUXE_Mario_Spec.pdf`). Verification: `sha256sum` on 2026-10-18 matched the expected uploaded-review hash exactly. PDF export metadata is 2026-10-17; this does not change the August 6 cover date or establish a new approved revision.

**Canonical private archive: pending.** This local working copy is the verified review reference, not an established durable archive. No approved durable private storage URI, retention/access owner or backup has been established. Archival completion is blocked until the founders provide/approve a durable private location and authorized reviewers can access the exact hashed file. Record that URI here after verification; never substitute a public URL or silently claim `temp/` is permanent storage. The product DOCX is alongside it locally, also outside version control.

Keep both documents and raw source renders confidential and outside application bundles/Git. Repository documentation records identifiers, factual mappings and review conclusions; application screenshots must contain authorized synthetic data. Request private source access from the founders when unavailable.

## Status vocabulary

- **Approved direction:** implementation must respect the accepted interaction and hierarchy, within the product plan and scoped issue. A reference image is not proof that all its controls or datasets are available.
- **Proposed design:** an illustrative layout or engineering adaptation; founder design acceptance remains necessary before treating the variation as approved.
- **Undesigned:** behavior is described, but final layout is absent or explicitly unfinished. Implement only scoped interactions and submit the layout for acceptance.
- **Deferred:** no current implementation obligation. A Phase 1 label in the deck does not automatically expand #58 or #53.

Functional status and design status are separate. “Visual foundation in draft PR” means neither merged nor functionally complete. See [screen traceability](SCREEN_TRACEABILITY.md).

## Visual and interaction direction

Logical Page 9, **physical page 31**, is explicitly the preferred night desktop/mobile Content Workspace reference. Use deep neutral surfaces, restrained violet/blue accents, clear typography, subtle boundaries and focused cards. Retain existing centralized tokens/components and accessibility. Light-theme support can remain structurally possible; a theme switcher is not required.

The workspace emphasizes three entry paths — Create With Me, Quick Draft, Bring Something In — followed by Continue Where You Left Off. Each post has one persistent home, a visible current state and one clear next action. Focused editing layers return to that home. Preserve creator authorship, explicit human acceptance, version history/non-destructive changes and real context across sessions. Avoid exposing all editing complexity at once.

Actions and progress must describe actual backend behavior. Present loading, unavailable, empty, unauthorized, error and conflict states distinctly where applicable. An unavailable list is not an empty account. Saved status requires a server acknowledgement. Preserve local input on failure. Tenant authorization remains server enforced. Keyboard/focus, readable contrast, reduced motion, touch targets and responsive navigation are baseline requirements.

## Reference coverage and unresolved designs

Established references include Pages 1–5 (physical 11–18), Import My World (21–23), Tornado examples (24–28), preferred Content Workspace (29–31), post/message/visual/review/ready illustrations (33–39), and supplementary gallery/calendar/guidance/insights/dashboard examples (40–46). These establish direction or examples, not blanket final layout approval. The matrix records physical indexes because logical page labels repeat or conflict.

Explicitly unfinished: Page 10A persistent Single-Post Dashboard (35, “STILL NEEDS DESIGN”), legacy Page 10a Layer 1 (47), Page 10b Layer 2 (48), Gallery (50), and Web Content Portal (20, further definition needed). Discover Me has illustrative screens (12–13) but the deck's next-actions page (66) still calls its three screens missing. Treat them as proposed, requiring acceptance. Caption editor text (49) has an empty mockup slot; physical 40 is labeled Caption/Text Editor but depicts a gallery. Physical 36 contains message-editor illustrations. None resolves a final caption layout automatically.

Open decisions: the accepted IA-1 dashboard composition; mobile stacked cards versus the dense three-column/bottom-navigation reference; desktop title/card density; Discover Me's final screens; Page 10 labels and editorial-layer boundaries; transcript placement; Gallery private view/release/download semantics; candidate-page placement; Web Portal scope; brand/account identity model; media/asset build-versus-partner choices; ideas/pillars and campaign overview. No vendor, security guarantee, new state or feature is approved by this list. #53 uses only `idea`/`drafting`; later media/review/publishing, broad Creator DNA and remaining OS modules stay deferred under #58's boundaries.

## Cross-layer review and change control

For any PR changing a user-facing interaction **or supporting API contract**, use this chain:

**Approved reference/journey → frontend state → API → domain → persistence → observable test/review evidence.**

Reviewers confirm:

1. Affected baseline page or user journey and scoped issue are identified.
2. Approved interaction is preserved; deviations and unfinished designs are explicit.
3. API/domain behavior supports the claims, including authorization and persistence.
4. Loading, empty, saved, error, unauthorized and conflict states are handled where relevant; mark inapplicable states with a reason.
5. Desktop/mobile layout, keyboard/focus and accessible states are appropriate.
6. Screenshots and relevant tests support the precise functional/fidelity status claimed.
7. Any missing layer remains incomplete; backend-only internal work identifies a relevant journey where one exists, or states why no UI journey applies.

Use the existing issue/PR/QA process. For a meaningful merged screen/contract change, update the matrix with merge SHA/PR, evidence and remaining gaps in that PR (or an explicitly linked follow-up after merge). Keep pending work identified by its draft PR. Test success does not grant founder design acceptance or satisfy #54's independent real-backend persistence gate.

A proposed baseline change must identify the old revision/source/page, reason, affected journeys/contracts/tests and before/after application evidence. Record explicit founder design acceptance in the issue/PR before treating it as approved. Product scope changes also require the applicable product/technical approval. Add a dated revision entry with approver and evidence link; keep historical source identifiers/hashes intact. A replacement source gets its own immutable private reference and checksum. Editorial traceability corrections may be reviewed normally without claiming design approval. Keep #58 open through its remaining PR 2/3 criteria; do not infer completion from PR #59.

## Revision history

| Revision | Date | Change | Acceptance |
| --- | --- | --- | --- |
| 1 | 2026-10-18 | Record supplied approved source hierarchy, verified PDF identity, review rules and initial screen inventory | Governance requested by founder; no new screen design approval. Durable archive pending. |

[PR #59 design review](PR59_DESIGN_REVIEW.md) records the current implementation comparison and pending acceptance. Next engineering handoff remains [#53](https://github.com/harmonie-joy/Luxe/issues/53) after PR #59 acceptance/merge; see [next actions](../04_NEXT_ACTIONS.md).
