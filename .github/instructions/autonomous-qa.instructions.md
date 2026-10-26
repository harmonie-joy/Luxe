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

Copilot/bot review output is advisory. Acceptance and repair eligibility require
an independent, allowlisted human reviewer account (`type: User`) to attest
the evidence in a COMMENT review on the current revision. The controller cannot
establish substantive review from text length, formatting or a bot's JSON.
If confidence is insufficient, require human QA; never manufacture an attestation.

For machine-readable evidence append exactly one fenced JSON object preceded
by `<!-- luxe-autonomy:qa:v1 -->`. Include:

- `reservation_id`: numeric comment ID of the current `qa-reserved` issue event.
- `head`, `base`: the exact reviewed PR head SHA and master/base SHA.
- `verdict`: `Accepted`, `Accepted with Notes`, `Changes Required`, or `Blocked`.
- `checks`: an object with exactly these keys: `scope`, `correctness`,
  `contracts`, `errors`, `tests`, `regressions`, `security_privacy`,
  `documentation`, `decisions`, `ux`. Each value contains `status` (`pass`,
  `fail`, `not-applicable`) and an `evidence` string explaining the observed
  evidence or why the check does not apply. Empty, punctuation-only and known
  placeholder-only text (such as `n/a`, `TBD`, `LGTM`, `not verified`) is rejected.
  Acceptance requires `scope`, `correctness`, `tests`, and `security_privacy`
  all to be applicable and `pass`; blanket N/A is not acceptance. The tests
  check must account for the actual verification in the handoff, even when the
  change is documentation-only. Other N/A checks need a substantive explanation.
- `findings`: an array, empty only when no findings remain. Each finding has
  `severity` (`Blocker`, `Major`, `Minor`, `Note`), `file` and `reason`.
  Optional `category: correctness` or `category: tests` identifies a finding
  that may be considered for one scoped repair. Sensitive findings must never
  receive those categories to enable automatic repair.

Automatic repair additionally requires both `scope` and `security_privacy` to
pass with evidence. Failed, missing, N/A or unverifiable safety checks require
human intervention regardless of finding categories. The existing one-repair
allowance belongs to the issue and cannot reset on a new head or replay.

The controller validates provenance and current revisions separately.
Free text such as LGTM, a successful review request, or an incomplete JSON
object does not establish acceptance. Do not manufacture a structured pass
when the review harness cannot inspect the issue, reservation or CI evidence.
