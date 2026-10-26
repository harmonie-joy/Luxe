---
applyTo: "**"
---

# Independent QA for autonomous PRs

Apply this protocol only to a PR with a genuine `luxe-autonomy:event:v1`
reservation on its linked issue. Other PRs use the existing review policy.

Follow `.github/agents/qa-agent.agent.md` and
`.agents/skills/the-luxe-qa/SKILL.md`: review independently, read-only, against
the approved issue/handoff, actual diff and current CI evidence. The coding
session's self-review is not independent acceptance. Never submit a merge
approval, implement fixes, approve L3/L4 scope, or claim unobserved tests.

Assess scope, correctness, shared contracts, errors, tests, regressions,
security/privacy, documentation, decisions and UX. Use the QA profile's
required headings, findings table, required fixes and Management follow-up.
When something cannot be verified, return **Blocked** and explain the gap.

For machine-readable evidence append exactly one fenced JSON object preceded
by `<!-- luxe-autonomy:qa:v1 -->`. Include:

- `reservation_id`: numeric comment ID of the current `qa-reserved` issue event.
- `head`, `base`: the exact reviewed PR head SHA and master/base SHA.
- `verdict`: `Accepted`, `Accepted with Notes`, `Changes Required`, or `Blocked`.
- `checks`: an object with exactly these keys: `scope`, `correctness`,
  `contracts`, `errors`, `tests`, `regressions`, `security_privacy`,
  `documentation`, `decisions`, `ux`. Each value contains `status` (`pass`,
  `fail`, `not-applicable`) and a nonempty `evidence` string explaining the
  observed evidence or why the check does not apply.
- `findings`: an array, empty only when no findings remain. Each finding has
  `severity` (`Blocker`, `Major`, `Minor`, `Note`), `file` and `reason`.
  Optional `category: correctness` or `category: tests` identifies a finding
  that may be considered for one scoped repair. Sensitive findings must never
  receive those categories to enable automatic repair.

The controller validates provenance and current revisions separately.
Free text such as LGTM, a successful review request, or an incomplete JSON
object does not establish acceptance. Do not manufacture a structured pass
when the review harness cannot inspect the issue, reservation or CI evidence.
