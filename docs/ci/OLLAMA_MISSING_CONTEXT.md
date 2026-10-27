# Ollama missing-context investigation

Task `TASK-20261027-AI-EVAL`, issue [#92](https://github.com/harmonie-joy/Luxe/issues/92),
investigated October 27–28, 2026 (Europe/Berlin). Separate branch
`fix/ollama-missing-context-evaluation`, based on PR #90 at `a0db5e5`.
This is a bounded development-evaluation correction, not a production AI change.

## Outcome

The original invalid-JSON failure is reproduced. It occurs in the generated
response **before** the application's JSON parser. A 768-token limit truncated one
seeded response; doubling that limit did not repair it: Ollama stopped at token 769
and returned the same unterminated JSON. Budget exhaustion is therefore not the
whole explanation. We did not identify or change the internal model/server decoder.

The investigation also found false PASS results: the existing prefix parser accepts
trailing non-JSON text, and schema validation accepts unsupported confidence 85–100
with no assets. The evaluator now exposes protocol validity, provider/schema
acceptance, bounded semantic assertions and uncertainty separately. Missing and
insufficient context remain explicit, nonzero failures; no voice is manufactured.

The current Voice DNA contract requires numeric tone scores, where zero means an
actual tone attribute, not unknown. This evaluation cannot certify appropriate
abstention under that contract. It reports `NOT_ESTABLISHED` rather than silently
treating confidence 0, empty/default fields or a syntactically valid object as success.

## Authorized scope and governance

The Founder requested PR #90 review, local reproduction, diagnosis, synthetic fixtures,
deterministic tests, benchmarks and independent QA. Risk L2 for development evaluation
and tests. Read root/backend AGENTS, architecture/decisions/progress/next-actions/work
logs, operating model and handoff template. No new product design decision is made;
the decision log is unchanged.

Changed areas: evaluator, its deterministic tests, small synthetic fixture, backend
provider/schema characterization tests, this report, corresponding runbook text and
narrow progress/work-log/next-action notes. No product implementation, production
provider/prompt/schema/settings, data model/migration, dependencies, workflow,
runner template, host configuration or paid AI changes. All four hosted CI gates
are inherited unchanged. No self-hosted runner is registered or activated.
This internal evaluation changes no UI journey or product API contract.

## PR #90 independent review

Pinned diff: `git diff 5562762...a0db5e5`; originating scope: issue #89.
Separate read-only review sessions assessed these axes independently:

| Axis | Findings | Evidence / limits |
| --- | --- | --- |
| Standards | 0 blocking documented-rule or actionable complexity findings | 12 focused tests, shell syntax and whitespace checks independently passed; hosted gates/inert template preserved |
| Spec | 0 blocking mismatch, 0 scope-creep findings | Preparation scope and explicit activation blockers honored; advisory model failure documented honestly |

Neither reviewer reran the full product suites or model inference for that review.
PR #90's schema-only exit contract was documented; this separate task strengthens
the evaluation rather than rewriting its historical evidence or expanding its scope.
No review grants runner activation, product design approval or merge permission.

## Reproduction environment

- Installed `gemma4:12b`, digest
  `4eb23ef187e2c5462566d6a1d3bbbc2f1346d0b4327cbb66d58fffbcc9b2b05c`.
- Ollama 0.30.10, loopback `127.0.0.1:11434`, runtime context 4096.
- Current WSL GPU: RTX 4060 Ti 16 GB, driver 610.88; no isolated runner/VM inference claimed.
- Existing `OllamaProvider`, `brand_voice_extraction_prompt` and
  `BrandVoiceExtractionResult` reused without production edits.
- Requests contain `stream=false`, the existing schema in `format`, and bounded
  `num_predict`. Replay seed 4 is inserted only by the evaluation transport adapter.
  No `think`, stop-token, production provider or model configuration is changed.
- Completion probes observed no separate thinking text. No reasoning or generated
  response content is published; only completion counts/flags/error positions.

The original symptom command against PR #90 was:

```bash
backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case missing-context
```

That returned `AIProviderError`, schema-valid false, exit1 at 54.593s. Subsequent
unseeded requests varied; seeded replay and completion metadata provide the sharper
diagnostic below. Seed controls improve replay, not universal determinism across
GPU, model/runtime versions or context-cache state.

## Hypotheses and one-variable controls

Ranked initially: output budget truncation; absent-evidence prompt/schema conflict;
provider/parser response handling. Each probe reused the original missing-context
input `{"brand_profile": {}, "assets": []}`.

| Probe | Observation | Conclusion |
| --- | --- | --- |
| Original request, seed 4, budget 768 | `length`,768 tokens,1,281 response characters, unterminated string at 1,235; provider error | Actual token-limit truncation reproduced |
| Same seed/prompt/schema; budget 1536 only | `stop`,769 tokens, same1,281 characters/error position | More budget alone does not fix this malformed generation; normal stop does not imply valid JSON |
| Same seed/budget 768; append JSON schema to prompt only | Input token count640→2,202; output hits768/length, still malformed at 3,177 | Suggested schema grounding alone does not resolve this case; not adopted |
| Original unseeded normal stops | Two samples contained 16 non-whitespace trailing characters; prefix parsed but full JSON failed | Provider prefix acceptance differs from strict document validity |
| Original unseeded empty context | Schema accepted confidence 85 and90; seed 2 accepted100; old evaluator reported PASS | Schema acceptance does not establish evidence grounding or appropriate uncertainty |

The first seeded control returned27.085s; the larger-budget control27.488s; schema
grounding29.964s. These are individual measurements, not stable latency thresholds
or a model-quality improvement. A temporary probe run overlapped evaluator edits and
was excluded from the controlled comparison; its requested budget was not applied.

## Findings by layer

| Layer | Confirmed finding | What is deliberately unresolved |
| --- | --- | --- |
| Local model/Ollama generation | Malformed output exists in the actual HTTP response, including normal-stop output; `format` does not guarantee observed validity | Exact decoder/runtime/model-template defect is not proven; no upgrade, engine change or retry loop |
| Prompt | Demands evidence-grounded numerical tone and at least 3 do/3 don't examples even with no assets; no complete abstention contract | No product prompt rewrite or new extraction eligibility policy |
| Schema | Required tone integers cannot express unknown; confidence and notes accept values without an evidence-consistency invariant | No production schema/model/API change, nullable-tone migration or replacement response envelope |
| Provider interface | Returns a validated Pydantic result and discards completion metadata | No return-type/API change; evaluator observes real HTTP separately |
| Parsing | Existing `raw_decode(...)[0]` intentionally accepts a valid prefix with trailing material; truncated strings correctly raise `AIProviderError` | No production parser rewrite, response repair or suffix trimming |
| Evaluation | Prior PASS meant only provider/schema acceptance, even for absent notes and unsupported certainty | Now separate assertions; free-form semantic correctness and appropriate abstention are not certified |

Ollama documents [schema formatting and separate completion metadata](https://docs.ollama.com/api/generate),
and recommends [schema grounding and lower temperature](https://docs.ollama.com/capabilities/structured-outputs).
Documentation describes supported controls, not a guarantee that this installed
model's response was correct. Related upstream reports are not treated as proof
of this installation's internal defect. No temperature or thinking experiment was
silently adopted as a fix.

## Evaluation contract, fixtures and errors

Version2 fixture contexts use the backend's `asset.content` and
`brief.content_objective` keys. Missing context retains the original input; the new
insufficient fixture supplies only a synthetic brand name and `Hello.`. Its label is
a deliberate evaluation expectation, not a production evidence classifier or a
calibrated minimum sample-length rule. Positive draft/voice fixtures are synthetic;
their canonical field corrections mean their timings are not an identical-input
comparison to version1.

Each row exposes:

- `completion.strict_json_valid`, prefix acceptance, trailing character count,
  completion flag/reason, safe token/duration metrics and JSON error position.
- `schema_valid` plus `schema_validation` (`NOT_RUN`, `ACCEPTED`, `REJECTED`), so a
  parser/transport failure is not misreported as a Pydantic rejection.
- Bounded assertions such as LinkedIn channel/nonempty draft, zero confidence,
  explanatory notes and absence of unsupported evidence-derived fields. Only field
  names/counts/booleans are exported, not generated text.
- `semantic_correctness=NOT_ESTABLISHED`; low-context
  `appropriate_uncertainty=NOT_ESTABLISHED` and an explicit numeric-tone contract limit.
- `failure_stages` and `case_pass`. Failed/unverified protocol checks, schema errors,
  bounded assertion failures and uncertainty limitations remain visible.

Exit0 means protocol/schema/bounded assertions passed for the selected non-low-context
case; it is not semantic quality certification. Exit1 means evaluation failure or an
unresolved uncertainty contract. Exit2 means model/service preconditions unavailable.
Consequently the full four-case suite currently exits1 even if all responses parse:
it intentionally includes two unresolved low-context contract probes. Increasing the
budget is diagnostic, not automatic recovery, and the default stays768.

The CLI uses an actual Requests Session with `trust_env=false`, disabled netrc and
loopback-only URL. A scoped adapter adds the replay seed and observes response metadata
while calling the unchanged real provider/parser. It does not return fixture data
or replace a failed response. Deterministic tests alone use synthetic response doubles.
Stale completion metadata is cleared before each case; a later failure cannot borrow
an earlier successful response's flags. No raw exception/model text is logged.

## Exact commands and verification

Use a Python environment containing existing backend requirements; no new package is
required. In an isolated worktree, the existing backend venv can be invoked by its
absolute path rather than copying credentials or `.env`.

```bash
python3 -m unittest discover -s .github/scripts -p 'test_local_ci.py'
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
DATABASE_URL=sqlite:////tmp/theluxe-missing-context-tests.sqlite3 backend/.venv/bin/python backend/manage.py test llm --noinput
timeout 100 backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case missing-context --seed 4 --num-predict 768
timeout 100 backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case missing-context --seed 4 --num-predict 1536
timeout 100 backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case insufficient-context --seed 4 --num-predict 768
timeout 300 backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case all --seed 4 --num-predict 768
git diff --check
git diff a0db5e5 -- .github/workflows .github/runner-templates backend/llm/providers.py backend/llm/prompts.py backend/llm/schemas.py backend/config/settings.py
```

The last diff must be empty: none of those production/workflow files change.
All commands use synthetic inputs and a test-only database; model evaluation does
not load Django application settings, read application rows or create AIRun records.
The optional evaluation is not a release-blocking model-quality gate.

Initial deterministic evidence: 20 focused/118 total automation tests pass;43 backend
LLM tests pass, including 5 new real provider/parser/schema characterization methods.
The Coding session's first red run executed 17 test methods with 16 parameterized
subtest errors in 5 new methods, due to missing protocol helper/signature support;
the 12 prior methods stayed green. Live reproduction above supplies the actual bug
signal; those scaffold errors are not claimed as 16 independent production defects.
Final benchmark and QA evidence is recorded before delivery below.

### Final four-case diagnostic benchmark

Installed model, version2 fixtures, seed 4, budget 768. This seed was chosen to replay
the defect; this small sample is **not** an unbiased reliability/quality estimate.

| Case | Seconds | Tokens / stop | Strict JSON | Provider schema | Bounded/uncertainty result |
| --- | ---: | --- | --- | --- | --- |
| draft | 7.508 | 165 / stop | FAIL | NOT_RUN | Semantic correctness not established |
| voice | 24.881 | 671 / stop | FAIL | NOT_RUN | Semantic correctness not established |
| missing-context | 27.566 | 768 / length | FAIL | NOT_RUN | Uncertainty contract unresolved |
| insufficient-context | 18.121 | 513 / stop | PASS | ACCEPTED | Confidence85, unsupported evidence-derived fields; FAIL |

Overall exit1;3.074 cases/minute; sampled aggregate GPU peak9,930MiB. Draft/voice
normal-stop malformed output shows the generation problem is not exclusive to the
empty-context fixture. No model reliability or speed improvement is claimed.

A separate insufficient-context run with the same seed/budget produced valid JSON,
schema acceptance, validated confidence 0, absent notes and an unsupported tone tag
at 12.025s; it also correctly failed evaluation. Different output with the same seed
shows residual runtime/cache/order nondeterminism. Validated confidence can include
the existing Pydantic default when omitted; it is not proof that the model explicitly
expressed uncertainty. The evaluator never treats these necessary checks as sufficient
for appropriate abstention.

Before/after improvement is **honest evaluation**, not repaired generation: prior
schema-only PASS accepted unsupported certainty and trailing junk; new `case_pass`
requires protocol/schema/bounded checks, and low-context uncertainty stays explicit.
No failed model result was replaced by test data or a success-shaped response.

Final independent QA: **Accepted with Notes for the bounded correction**. Reviewer
independently reran20 focused/118 total automation tests,5 provider/schema replay
methods, compilation and whitespace checks; no blocking finding. Model measurements
are coordinator evidence, not independently rerun inference. The four hosted CI jobs
and human review/merge remain separate gates. No runner activation is authorized.

## Independent QA handoff and remaining work

Reviewer must inspect the complete change since `a0db5e5`, not re-review the parent
infrastructure diff as new work. Check issue#92 scope, explicit nonzero low-context
results, actual HTTP Session/no credentials, content-free metadata, full-vs-prefix
parse, never-run-vs-rejected schema states, no fabricated defaults, and no changes to
the four hosted gates or product providers/schemas. Re-run deterministic tests and
the real synthetic provider replay tests. Model runs are coordinator evidence unless
the reviewer separately runs them; do not equate test doubles with live inference.

No migration/API/UI change or new decision record is required. Human review/merge
remains mandatory. Do not merge this task into the PR#90 feature branch: wait for
PR#90 to be human-merged, then retarget this stacked draft PR to master before
reviewing its final current gates and merging separately.
Future product work must separately decide an explicit insufficient-evidence/abstention
contract and extraction eligibility rules before changing prompt/schema/provider
behavior. A separately approved local runtime investigation may address malformed
structured generation. Neither is silently implemented here; no retry/prompt-repair
loop hides the existing failure, and no product roadmap priority changes.
