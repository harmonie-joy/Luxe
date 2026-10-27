# Trusted local CI runbook

Status: **preparation only; registration and activation blocked**. See
[audit and acceptance evidence](RUNNER_AUDIT.md), issue [#89](https://github.com/harmonie-joy/Luxe/issues/89).
These commands do not authorize the privileged or registration steps marked below.

## Trust boundary and activation conditions

The current public repository has zero self-hosted runners. Keep it that way until
an independent security reviewer verifies a boundary against arbitrary PR workflows.
A repository-scoped persistent runner accepts any eligible job targeting its labels;
another PR can introduce its own workflow. Conditions on our manual workflow,
environment approvals, secret-free execution and obscure labels do not prevent that.
[GitHub warns against public-repository self-hosting](https://docs.github.com/en/actions/reference/security/secure-use).
Private repositories also require trust review for everyone able to submit PR code.

The prepared alternative deviates from the preferred repository scope: an organization
runner group, restricted to this repository and **only**
`harmonie-joy/Luxe/.github/workflows/trusted-local.yml@refs/heads/master`.
Group enforcement is the server-side boundary; job conditions are defense in depth.
The template additionally refuses public repositories. Do not change visibility or
remove that check to activate it without a separate approved design. A public-repo
group-restricted option needs explicit threat review and a separately reviewed patch.
Group permissions/feature support are NOT VERIFIED (403 with current credential).
GitHub documentation describes plan-dependent group capabilities; verify the actual
organization settings/API instead of assuming availability on its current Free plan.

Before activation, all must be independently verified:

1. Founder approves exact L3 scope, isolated environment, access policy and availability.
2. Dedicated Linux VM, separate non-admin `luxe-ci` account, no sudo for the runner.
   No personal shares/drives/home directories, SSH-agent sockets, clipboard, production
   credentials, cloud metadata or personal/LAN services. Docker, if needed, is inside
   that VM; its socket never controls the desktop's shared engine. Snapshot/rebuild VM
   after suspected compromise; container cleanup alone cannot restore trust.
3. Admin sets VM CPU/RAM/disk/process quotas, egress/network isolation and allowed DNS/
   HTTPS dependencies. Allow GitHub Actions endpoints and reviewed GitHub/PyPI/npm/
   container/browser dependencies; no inbound runner port is needed. Deny host/LAN/
   production routes while preserving the loopback test/Ollama services. No firewall
   or security setting is automatically disabled. Host protections remain enabled.
4. Organization owner verifies exact selected-workflow/ref group enforcement and
   repository access. A disposable negative test from an untrusted PR workflow must
   be denied **before allocation**, with no desktop runner available during policy
   experiments. Do not test dangerous code against the desktop.
5. Protected-default-branch workflow is reviewed and merged by a human. Only then
   copy the template to `.github/workflows/trusted-local.yml` in the activation PR.
   Retain fixed enum choices, no schedule, owner ID57563103, no ref/image/command/model
   input, read permissions and no persisted checkout credentials. Validate workflow
   routing, group configuration and branch protection after merge.
6. Install tooling and verify Docker/PG/browser behavior inside the VM. Assign
   `theluxe-local` only after CPU validation. Add `theluxe-gpu` only after GPU inference
   works **in that same isolated environment**. Host/container GPU diagnostics alone
   do not establish VM GPU passthrough or fit. No model download/fine-tuning.

Windows WSL2 is running now, not an availability guarantee. A separate distro with
automount/interoperability disabled is useful separation but **not accepted as a
complete personal-host/network security boundary**. Shared Docker Desktop integration
must not bridge it back to the personal daemon. WSL systemd does not establish
Windows boot/login persistence. Windows Hyper-V/VM startup and GPU assignment require
separate admin review; GPU usability in WSL does not establish discrete-GPU VM support.
CPU-only VM plus manually invoked WSL synthetic AI diagnostics is a valid interim
feedback arrangement with **no GitHub runner registered**.

## Safe local diagnostic and validation now

From the dedicated preparation worktree or a trusted clean checkout:

```bash
python3 .github/scripts/runner_health.py
python3 .github/scripts/runner_health.py --github
python3 -m unittest discover -s .github/scripts -p 'test_local_ci.py'
bash -n .github/scripts/run_local_integration.sh
timeout --signal=TERM 900 bash .github/scripts/run_local_integration.sh backend
timeout --signal=TERM 900 bash .github/scripts/run_local_integration.sh browser
```

The integration script intentionally tests **committed HEAD**, not unstaged code.
It archives only tracked backend/frontend files; tracked `.env*` files cause refusal.
Never use it to evaluate arbitrary PR code on a persistent runner. Existing app
tests are trusted for this local preparation run; their success is not live-runner
acceptance. Commands install existing Python/npm requirements into temporary paths
and download Chromium, not OS packages. An unavailable network/dependency/browser
fails normally. No developer compose stack or persistent database is used.

PostgreSQL16 runs as non-root uid999 with no added capabilities/privilege, 768MiB RAM,
two CPUs, 128 PIDs, bounded tmpfs database, and a random loopback port. All database
and user data are synthetic. A fresh temporary HOME/environment prevents developer
credentials/.env/proxy/database configuration leaking into tests. Repeated calls
recreate services; cleanup removes only its unique container name after checking
the ownership label, and its temporary
tree. Cold setup is intentional; a later approved VM can retain only reviewed package/
browser caches in its dedicated CI account. Do not share caches with public PR code.

For optional AI, use a Python environment containing the existing backend requirements:

```bash
backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case draft
timeout 300 backend/.venv/bin/python .github/scripts/evaluate_local_ai.py --model gemma4:12b --case all --seed 4 --num-predict 768
```

If that venv is absent, create a fresh temporary venv and install
`backend/requirements/base.txt`; the inert template shows that procedure. Exact model
must already be installed at loopback `127.0.0.1:11434`; no pull is performed.
Unavailable service/model, invalid output, insufficient resources or timeout fail
honestly. Exit2 means precondition unavailable/NOT VERIFIED; exit1 includes protocol,
schema, bounded-assertion failures or an unresolved uncertainty contract. Exit0 means
the selected case passed those checks, not semantic-quality certification. Version2
separates strict JSON/prefix parsing, completion metadata, schema acceptance, bounded
semantic assertions and uncertainty. Missing and insufficient context intentionally
remain nonzero: the production voice schema cannot represent unknown tone. The full
four-case suite therefore currently exits1; it is advisory, not a deterministic
release gate. See the [separate investigation](OLLAMA_MISSING_CONTEXT.md) for replay
commands, synthetic fixtures, evidence and limitations. The inert runner template is
unchanged; its old240-second AI limit must be reviewed before any future activation.
Sampled peak GPU memory includes **all GPU processes**, not just this model; cases/min
is not model tokens/sec. Provider evaluation does not create database AIRun records;
application provenance/approval is covered separately by existing backend tests.

## Official runner installation: privileged/manual, NOT EXECUTED

Only after all activation conditions and explicit approval, an administrator provisions
the VM, account, packages, Docker and network policy. Minimum packages follow existing
CI: Git, Python3.12 with venv, Node20/npm, Docker Engine inside VM, required Chromium
libraries. GPU/Ollama are optional and private inside that VM. Do not expose Ollama
publicly or connect it through a broad host/LAN endpoint.

Use [GitHub's current official installation page](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners)
and the authorized organization's Settings → Actions → Runners → New runner. Choose
Linux x64 and the verified restricted group. On the isolated VM, as `luxe-ci`:

1. Create an empty dedicated `~/actions-runner` directory (mode0700). If `.runner`
   exists, inspect status rather than re-registering. If an archive/install exists,
   verify it before reusing; never overwrite a running installation.
2. Download the versioned archive from the official `actions/runner` release named
   by GitHub's setup page; verify the exact SHA-256 shown there before extraction.
   Do not hardcode a version that will go stale or use an unaudited installer image.
3. Obtain the supported short-lived registration token privately in the authorized
   UI or API. Tokens expire after one hour. Do not echo, paste into chat, log,
   commit, save in a script, or run under shell tracing. Use interactive configuration
   to avoid putting tokens in command history:

   ```bash
   umask 077
   ./config.sh --url https://github.com/harmonie-joy --runnergroup theluxe-trusted --name theluxe-ci-linux --labels theluxe-local
   ```

   Enter the token only at the local interactive token prompt. Organization registration
   and access are deliberate changes from the preferred repository-scoped model; no
   repo registration command is offered while its routing boundary is unsafe.
4. Verify `.runner` and credential files stay in the private install directory,
   outside every repository/worktree/cache/artifact. Never inspect/print credential
   contents. No long-lived personal token is installed in the runner job environment.
5. Run `./run.sh` in the foreground for the first smoke, Ctrl-C to stop. Linux service
   installation uses GitHub's `svc.sh` with admin approval; it is not required for
   on-demand operation and is not performed by this task. Avoid root service account.

Keep official automatic runner updates enabled; review/restart on-demand installation
regularly. Record runner version and image/tool changes without application content.
Rebuild the disposable VM periodically and after unexpected behavior.

## Live verification commands: NOT VERIFIED until activated

These commands require authorized organization credentials/policy; do not broaden
the current credential automatically:

```bash
gh api orgs/harmonie-joy/actions/runner-groups --jq '.runner_groups[] | {name,visibility,restricted_to_workflows,selected_workflows}'
gh api orgs/harmonie-joy/actions/runners --jq '.runners[] | {id,name,status,busy,labels:[.labels[].name]}'
gh api repos/harmonie-joy/Luxe/branches/master --jq '{protected,sha:.commit.sha}'
gh workflow run trusted-local.yml --repo harmonie-joy/Luxe --ref master -f suite=health
gh run list --repo harmonie-joy/Luxe --workflow trusted-local.yml --limit 5
gh workflow run trusted-local.yml --repo harmonie-joy/Luxe --ref master -f suite=backend
gh workflow run trusted-local.yml --repo harmonie-joy/Luxe --ref master -f suite=browser
gh workflow run trusted-local.yml --repo harmonie-joy/Luxe --ref master -f suite=ai
```

For the returned run ID, `gh run watch RUN_ID --repo harmonie-joy/Luxe --exit-status`.
Repeat backend validation twice, inspect cleanup, stop/restart foreground runner and
repeat health. Validate a deliberate failing check only through a separately reviewed
synthetic failing-test commit on protected default code; no command/ref input is added
for this test. Confirm the failed job is visible, services removed, and a later known
good revision recovers. A local mocked failure is not that GitHub acceptance proof.

The template does not export arbitrary test artifacts; logs contain synthetic tests
and metrics. Existing hosted real-e2e diagnostics retain seven days. No raw traces,
storage state, cookies, private source documents or customer content are permitted.
Do not publish health output if future installed-model names reveal private data.

## Health, recovery, cleanup and removal

Foreground lifecycle: `./run.sh`, Ctrl-C, restart `./run.sh`. Optional approved service:
inside the dedicated install directory use `sudo ./svc.sh status`, `start`, `stop`;
service installation/uninstallation remain admin actions. GitHub runner list shows
online/busy state; inspect local `_diag` only on the private VM and do not upload raw
logs without review. Health diagnostics never certify registration/connectivity just
because a binary or configuration file exists.

If a job fails: inspect its synthetic check/log, stop further work, confirm owned
container/temp cleanup, check disk/RAM/Ollama status, then rerun explicitly. If the VM
is unresponsive or killed, traps cannot execute. Inside the dedicated VM only:

```bash
docker ps -a --filter label=com.theluxe.ci=integration --format '{{.ID}} {{.Status}}'
find /tmp -maxdepth 1 -type d -name 'theluxe-ci.*' -mmin +120 -print
```

Inspect each candidate against job ownership/status before removing its exact ID/path.
Never use global `docker system prune`, broad volume removal, wildcard temp deletion,
or cleanup of developer caches. Successful/interrupted normal runs clean their own
services/files; interrupted downloads and SIGKILL leftovers require this targeted
recovery. VM disk quotas contain accumulation. Set package/browser cache retention
only inside that dedicated environment; initially scripts retain neither.

Rollback preparation: revert the preparation commit through a human-reviewed PR;
the inert template has no registration/settings effect. Disable any future activated
workflow first, stop the runner, inspect no job is active, and revoke its server-side
registration. In the dedicated runner directory obtain an authorized short-lived
remove token privately and invoke interactive `./config.sh remove` (never echo token).
For an approved service, stop and `sudo ./svc.sh uninstall` first. Verify absence using
the organization runner API, then delete only the dedicated VM/install after confirming
it holds no needed developer data. Do not unregister unrelated runners or destroy the
personal WSL distro. Registration removal and restart have **not** been tested here;
there was no runner to remove.

## Development feedback lifecycle

Management scopes an issue; Founder approves L3/L4; Coding produces a branch/draft PR;
hosted checks validate that PR; independent QA reviews current diff/evidence; human
merges. The prepared manual workflow tests only default-branch committed code. It
cannot certify an arbitrary feature-branch SHA before merge. Trusted extended validation
of a particular PR needs a separately approved pinned-revision/access design; do not
add a free-form ref input as a shortcut. The current local command may test a branch
only when a maintainer personally trusts that checkout outside a persistent runner.

Keep current path-aware gh-aw validation, dependency caches, one browser worker,
synthetic fixture guards, and package/test commands. Skip a new selected-test mapping
until timing justifies its maintenance and required-check semantics are designed.
No new schedules, paid inference loops, automatic repairs, self-approval or merge.
