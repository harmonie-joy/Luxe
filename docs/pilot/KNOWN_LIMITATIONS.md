# Pilot Known Limitations

These are known boundaries of the current Creator Home and idea/drafting
checkpoint flow. They are not promises about future behavior. See the
[current engineering status](../04_NEXT_ACTIONS.md) and
[IA-1 real-service verification report](../qa/IA1_REAL_BROWSER_VERIFICATION.md)
for supporting evidence.

- **A repeated create can make a duplicate.** Initial Project/ContentItem
  creation does not guarantee exactly-once behavior. If the result is
  uncertain, check Creator Home before retrying.
- **Checkpoint conflicts require a deliberate choice.** Stale revisions are
  reported as conflicts; the app does not automatically merge competing
  changes. Reload/discard is deliberate.
- **Unsaved edits are not recovery storage.** Edits that have not been saved in
  a checkpoint are component state, not offline or browser-crash recovery.
- **BrandVoice approval is version-specific.** A new item requires explicit
  human acceptance of the exact BrandVoice version. Activation alone is not
  approval, and a saved item stays pinned to its accepted version.
- **The demonstrated workflow is bounded.** It covers idea/drafting checkpoints
  and resume, not full Creator DNA, final post approval, media finalization, or
  publishing.
- **A successful demo is not release or design acceptance.** It does not
  establish production readiness, complete the wider Internal Alpha, or imply
  founder approval of pending screen designs.
