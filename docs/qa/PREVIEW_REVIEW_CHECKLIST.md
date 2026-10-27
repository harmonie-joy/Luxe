# Private-preview review checklist

Use this checklist to record what the available evidence supports. Review the
specific change and journey in scope; do not generalize one verification result
to the whole product.

## Functional verification

- [ ] Identify the scoped change and the exact code revision reviewed.
- [ ] Link the tests, browser captures, or verification report that support each
  functional claim. State what was actually exercised and where evidence is
  absent.
- [ ] Distinguish real-service persistence and authorization evidence from
  synthetic tests or visual captures; neither is a substitute for the other.
- [ ] Record observed failures, known limitations, and unverified behavior.
  Do not describe a limitation as resolved unless evidence shows it.
- [ ] Confirm screenshots use authorized synthetic data and support only the
  specific behavior or appearance they show.

The [IA-1 real-browser verification report](IA1_REAL_BROWSER_VERIFICATION.md)
records its own scope, commands, results, evidence, and limitations. It
explicitly says that its functional acceptance does not complete the wider
Internal Alpha milestone or authorize release or deployment.

## Founder design acceptance

- [ ] Identify the affected page or journey and any proposed, unfinished, or
  deviating design.
- [ ] Record explicit Founder design acceptance in the issue or PR before
  describing a design as accepted.
- [ ] Keep design acceptance marked pending when that evidence is absent.

Tests, screenshots, and merge do **not** establish Founder design acceptance.
The [UX baseline](../ux/UX_BASELINE.md) separates functional status from design
status and requires explicit acceptance to treat a proposed design as approved.

## Release and deployment readiness

- [ ] Review release and deployment status separately against the current
  [Next Actions](../04_NEXT_ACTIONS.md); record outstanding gates without
  implying they are complete.
- [ ] Do not claim deployment, production readiness, or broader release
  readiness without evidence for those claims and the applicable approval.

This checklist is not a release decision or deployment authorization. The
verification report and Next Actions document describe functional evidence and
remaining release work separately; repository presence or successful tests do
not establish public distribution permission or readiness.
