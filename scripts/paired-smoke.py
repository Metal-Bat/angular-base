"""Run the existing real HTTP browser journey against owned disposable services."""

import argparse
import hashlib
import json
import os
import re
import shutil
import signal
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--backend-root", default=os.getenv("DELIVERY_BACKEND_ROOT"))
parser.add_argument("--notifications", action="store_true")
parser.add_argument("--foundations", action="store_true")
parser.add_argument("--foundation-task", choices=["009", "010", "011", "013", "014", "015", "016", "021", "028", "029", "030", "031"])
parser.add_argument("--form-designer-scope", choices=["core", "repairs", "kinds", "presentation"], default="core")
args = parser.parse_args()
if args.form_designer_scope != "core" and (not args.foundations or args.foundation_task != "016"):
    raise SystemExit("--form-designer-scope requires --foundations --foundation-task 016")
if args.foundation_task and not args.foundations:
    raise SystemExit("--foundation-task requires --foundations")
if not args.backend_root:
    raise SystemExit("Set DELIVERY_BACKEND_ROOT or --backend-root; no mock fallback is allowed.")
backend = Path(args.backend_root).resolve()
frontend = Path(__file__).resolve().parent.parent
python = backend / ".venv/bin/python"
if not python.exists():
    raise SystemExit("The selected backend virtualenv is required.")

containers = []
api_process = None
worker_process = None
artifacts = frontend / ("artifacts/paired-foundations" if args.foundations else "artifacts/paired-notifications" if args.notifications else "artifacts/paired-smoke")
if args.foundation_task:
    artifacts = frontend / ("artifacts/paired-foundations-" + args.foundation_task)
if args.form_designer_scope != "core":
    artifacts = artifacts.with_name(artifacts.name + "-" + args.form_designer_scope)
artifacts.mkdir(parents=True, exist_ok=True)
evidence = {"form_designer_scope": args.form_designer_scope, "task_scope": args.foundation_task or "full", "started_at": time.time(), "evidence": "real HTTP / disposable services", "commands": [],
            "browser_version": subprocess.check_output([os.getenv("FIREFOX_BINARY", "firefox"), "--version"], text=True).strip(),
            "limits": ["No live vendor/deployment/manual accessibility acceptance" if args.notifications or args.foundations else "No worker/provider/deployment/manual accessibility acceptance", "Foundation scope: actual contract/persistence and clocked scheduler/worker; full MAP coverage and team-member selection remain separate" if args.foundations else "C02-C13 new producer APIs are consumed by their owning tasks"]}


def execute(label, command, cwd, env, log):
    with log.open("w") as output:
        result = subprocess.run(command, cwd=cwd, env=env, stdout=output, stderr=subprocess.STDOUT, timeout=240, check=False)
    evidence["commands"].append({"name": label, "exit_code": result.returncode,
                                 "log_sha256": hashlib.sha256(log.read_bytes()).hexdigest()})
    if result.returncode:
        raise RuntimeError(f"{label} failed ({result.returncode}); inspect {log}")


def docker(*arguments):
    result = subprocess.run(["docker", *arguments], capture_output=True, text=True, check=True, timeout=60)
    return result.stdout.strip()


def service(label, image, port, variables, command):
    name = "app-fe-smoke-" + label + "-" + uuid.uuid4().hex[:10]
    containers.append(name)
    evidence["owned_containers"] = list(containers)
    docker("run", "--detach", "--rm", "--pull=never", "--name", name, "--cpus=1", "--memory=512m",
           "-p", f"127.0.0.1::{port}", *(["--entrypoint", "dragonfly"] if label == "cache" else []), *sum((["-e", value] for value in variables), []), image, *command)
    host_port = docker("port", name, str(port)).rsplit(":", 1)[1]
    return name, host_port


def source_identity(root):
    files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=root, text=True).splitlines()
    selected = [(name, hashlib.sha256((root / name).read_bytes()).hexdigest()) for name in sorted(set(files)) if name.startswith(("src/", "server/", "scripts/")) and (root / name).is_file()]
    return hashlib.sha256(json.dumps(selected).encode()).hexdigest()

# Run an immutable owned copy when the peer is being edited concurrently. The
# peer checkout remains read-only; record its identity separately from runtime.
peer_backend = backend
snapshot = None
if args.notifications or args.foundations:
    snapshot = tempfile.TemporaryDirectory(prefix="app-fe-notification-backend-")
    runtime = Path(snapshot.name)
    names = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=backend, text=True).splitlines()
    for name in sorted(set(names)):
        source = backend / name
        if not source.is_file() or name.startswith(("graphify-out/", "artifacts/")): continue
        destination = runtime / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    # Compiled gettext catalogs are ignored build assets required by live docs/UI.
    catalogs = {}
    for language in ('en', 'fa'):
        name = f'src/locales/{language}/LC_MESSAGES/messages.mo'
        source = peer_backend / name
        if not source.is_file():
            raise RuntimeError(f'Required compiled locale catalog unavailable: {name}')
        target = runtime / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        catalogs[name] = hashlib.sha256(target.read_bytes()).hexdigest()
    evidence['backend_locale_assets_start'] = catalogs
    (runtime / ".git").symlink_to(backend / ".git", target_is_directory=True)
    (runtime / ".venv").symlink_to(backend / ".venv", target_is_directory=True)
    backend = runtime
    python = backend / ".venv/bin/python"
    evidence["backend_runtime"] = "owned immutable source snapshot; original peer remains read-only"
    evidence["backend_peer_root"] = str(peer_backend)
    evidence["backend_peer_source_snapshot_sha256"] = source_identity(peer_backend)

evidence["backend_source_start_sha256"] = source_identity(backend)
evidence["frontend_source_start_sha256"] = source_identity(frontend)
evidence["backend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=backend, text=True).strip()
evidence["frontend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=frontend, text=True).strip()

try:
    with tempfile.TemporaryDirectory(prefix="app-fe-http-") as temporary:
        temp = Path(temporary)
        postgres, pg_port = service("postgres", "postgres:18.1-bookworm", 5432,
            ["POSTGRES_USER=test", "POSTGRES_DB=test", "POSTGRES_PASSWORD=disposable-test"], [])
        for attempt in range(60):
            ready = subprocess.run(["docker", "exec", postgres, "pg_isready", "-U", "test"], capture_output=True, check=False)
            if ready.returncode == 0:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("Disposable PostgreSQL did not become ready")
        _, cache_port = service("cache", "sample_cache:latest", 6379, [], ["--dir=/data", "--proactor_threads=1", "--logtostderr"])
        _, storage_port = service("storage", "quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z-cpuv1", 9000,
            ["MINIO_ROOT_USER=disposable-access", "MINIO_ROOT_PASSWORD=disposable-secret"], ["server", "/data"])
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "PYTHONPATH": "src:.",
               "PROJECT_NAME": "frontend-disposable-smoke", "VERSION": "1.0.0",
               "SECRET_KEY": "frontend-disposable-secret-key-32-characters", "ALGORITHM": "HS256",
               "POSTGRES_USER": "test", "POSTGRES_PASSWORD": "disposable-test", "POSTGRES_DB": "test",
               "POSTGRES_HOST": "127.0.0.1", "POSTGRES_PORT": pg_port,
               "CACHE_DSN": f"redis://127.0.0.1:{cache_port}",
               "CELERY_BROKER_URL": f"redis://127.0.0.1:{cache_port}/1" if args.notifications or args.foundations else "amqp://guest:guest@127.0.0.1:59999/disposable",
               "CELERY_RESULT_BACKEND": f"redis://127.0.0.1:{cache_port}/2",
               "CELERY_AUTOMATION_QUEUE": "frontend-owned-notices",
               "CELERY_REPORT_QUEUE": "frontend-owned-reports",
               "NOTIFICATION_STATE_FILE": str(temp / "notification-id"),
               "S3_ENDPOINT": f"http://127.0.0.1:{storage_port}", "S3_ACCESS_KEY": "disposable-access",
               "S3_SECRET_KEY": "disposable-secret", "S3_BUCKET": "frontend-disposable",
               "LOG_FILE": str(temp / "service.jsonl"), "LOG_OUTPUTS": '["file"]',
               "OTEL_TRACES_EXPORTER": "none", "OTEL_METRICS_EXPORTER": "none", "OTEL_LOGS_EXPORTER": "none",
               "BROWSER_ACCOUNTS_FILE": str(temp / "accounts.json")}
        if args.foundation_task == "021":
            # Metadata validation requires a registered HTTPS endpoint. This
            # reserved host is never verified or invoked by this authoring slice.
            env["INTEGRATION_HTTP_ENDPOINTS"] = '{"owned_authoring":"https://authoring.invalid"}'
        execute("migrate owned database", [str(python), "-m", "alembic", "upgrade", "head"], backend, env, temp / "migration.log")
        execute("seed existing browser journey", [str(python), "scripts/seed_frontend_browser.py"], backend, env, temp / "seed.log")
        if args.foundations:
            env['HELP_RELEASE_METADATA_FILE'] = str(frontend / 'docs/delivery/help-release-metadata.json')
            env['FOUNDATION_TASK'] = args.foundation_task or ''
            execute('extend owned foundation actors', [str(python), str(frontend / 'scripts/foundations-paired-seed.py')], backend, env, temp / 'foundation-seed.log')
        if args.notifications or args.foundations:
            worker_log = (temp / "worker.log").open("w")
            worker_process = subprocess.Popen([str(python), "-m", "celery", "-A", "core.celery_app:celery_app", "worker", "--pool=solo", "--concurrency=1", "--queues=frontend-owned-notices,frontend-owned-reports", "--loglevel=INFO", "--without-gossip", "--without-mingle", "--without-heartbeat"], cwd=backend, env={**env,"LOG_OUTPUTS":'["console","file"]'}, stdout=worker_log, stderr=subprocess.STDOUT)
            for attempt in range(150):
                if worker_process.poll() is not None: raise RuntimeError("Owned notification worker exited")
                if " ready." in (temp / "worker.log").read_text(): break
                time.sleep(.1)
            else: raise RuntimeError("Owned notification worker startup timeout")
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        with (temp / "api.log").open("w") as output:
            api_process = subprocess.Popen([str(python), "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)],
                cwd=backend, env=env, stdout=output, stderr=subprocess.STDOUT)
            origin = f"http://127.0.0.1:{port}"
            for attempt in range(100):
                if api_process.poll() is not None:
                    raise RuntimeError(f"Disposable API exited; inspect {temp / 'api.log'}")
                try:
                    with urllib.request.urlopen(origin + "/health", timeout=1) as response:
                        if response.status == 200:
                            break
                except (OSError, urllib.error.URLError):
                    time.sleep(0.5)
            else:
                raise RuntimeError("Disposable API startup timed out")
            with urllib.request.urlopen(urllib.request.Request(origin + "/api/v1/openapi.json", headers={"Accept-Language": "en"}), timeout=10) as response:
                live_contract = json.load(response)
            producer = json.loads((frontend / "docs/reference/app-be-001/openapi-en.json").read_text())
            expected = {key: producer[key] for key in ["paths", "components"]}
            actual = {key: live_contract[key] for key in ["paths", "components"]}
            canonical = lambda document: hashlib.sha256(json.dumps(document, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
            evidence["actual_http_contract_match"] = actual == expected
            evidence["expected_contract_sha256"] = canonical(expected)
            evidence["actual_contract_sha256"] = canonical(actual)
            expected_schemas = producer["components"]["schemas"]
            actual_schemas = live_contract["components"]["schemas"]
            evidence["contract_drift"] = {
                "changed_schemas": sorted(key for key in set(expected_schemas) | set(actual_schemas)
                                          if expected_schemas.get(key) != actual_schemas.get(key)),
                "changed_paths": sorted(key for key in set(producer["paths"]) | set(live_contract["paths"])
                                        if producer["paths"].get(key) != live_contract["paths"].get(key)),
            }
            if args.notifications:
                inbox = json.loads((frontend / "docs/reference/inbox.openapi.json").read_text())
                scoped_actual = {"paths": {key:live_contract["paths"][key] for key in inbox["paths"]}, "schemas": {key:live_contract["components"]["schemas"][key] for key in inbox["components"]["schemas"]}}
                scoped_expected = {"paths":inbox["paths"], "schemas":inbox["components"]["schemas"]}
                evidence["actual_inbox_contract_match"] = scoped_actual == scoped_expected
                evidence["inbox_contract_sha256"] = canonical(scoped_actual)
                if scoped_actual != scoped_expected: raise RuntimeError("Actual unified inbox/SSE contract drift")
            contract_blocked = actual != expected and not args.notifications
            if contract_blocked:
                evidence["blocked_at"] = "actual HTTP contract reconciliation; browser not started"
                # Gather independent form evidence, but still fail the paired gate.
                # No drift is accepted and no expected hash is replaced.
                unrelated_operation_metadata = (
                    args.foundation_task == "016"
                    and evidence["contract_drift"]["changed_paths"] == ["/api/v1/step-types/operations"]
                    and evidence["contract_drift"]["changed_schemas"] == [
                        "BusinessOperationDTO", "SuccessResponse_list_BusinessOperationDTO__"
                    ]
                )
                # Collect actual task-specific evidence for two description-only
                # amendments; complete producer readiness still fails below.
                description_only = False
                if (args.foundation_task == "021"
                    and evidence["contract_drift"]["changed_paths"] == []
                    and evidence["contract_drift"]["changed_schemas"] == ["GraphBinding", "GraphStep"]):
                    wire_expected = json.loads(json.dumps(expected))
                    wire_actual = json.loads(json.dumps(actual))
                    amendments = []
                    for schema, field in [("GraphBinding", "source_schema"), ("GraphStep", "field_policy")]:
                        before = wire_expected["components"]["schemas"][schema]["properties"][field]
                        after = wire_actual["components"]["schemas"][schema]["properties"][field]
                        amendments.append({"schema": schema, "field": field, "expected_description": before.pop("description", None), "actual_description": after.pop("description", None)})
                    description_only = wire_expected == wire_actual
                    if description_only:
                        evidence["unfrozen_description_amendments"] = amendments
                        (artifacts / "unfrozen-description-amendments.json").write_text(json.dumps(amendments, indent=2))
                        evidence["independent_slice_contract_scope"] = "All paths/components and wire fields match after excluding only the recorded two descriptions. Frozen producer readiness remains failed; no SDK/backend exception is accepted."
                if not unrelated_operation_metadata and not description_only:
                    raise RuntimeError("Actual HTTP producer schema drift")
                evidence["independent_slice_contract_match"] = True
                if unrelated_operation_metadata:
                    evidence["independent_slice_contract_scope"] = (
                    "All unchanged paths/schemas, including form authoring, runtime, request pins and session APIs; "
                    "new step operation metadata is outside APP-FE-016. No full producer acceptance."
                )
            browser_env = {**os.environ, "BACKEND_BROWSER_ORIGIN": origin,
                           "BACKEND_BROWSER_ACCOUNTS": str(temp / "accounts.json"),
                           "BROWSER_REPORT_PATH": str(artifacts / "browser.json")}
            if args.foundations:
                browser_env.update(env)
                browser_env.update(FOUNDATION_TASK=args.foundation_task or '', FORM_DESIGNER_SCOPE=args.form_designer_scope, FOUNDATIONS_BROWSER_CHECKS='1', FOUNDATION_BACKEND_ROOT=str(backend), FOUNDATION_BACKEND_PYTHON=str(python), FOUNDATION_ACTION_SCRIPT=str(frontend / 'scripts/foundations-paired-action.py'), SUPPORT_ACTION_SCRIPT=str(frontend / 'scripts/support-paired-action.py'), CALENDAR_ACTION_SCRIPT=str(frontend / 'scripts/calendar-paired-action.py'), ANALYTICS_ACTION_SCRIPT=str(frontend / 'scripts/analytics-paired-action.py'), OWNED_BACKEND_PID=str(api_process.pid))
            if args.notifications:
                browser_env.update(env)
                browser_env.update(NOTIFICATION_BROWSER_CHECKS="1", NOTIFICATION_BACKEND_ROOT=str(backend), NOTIFICATION_BACKEND_PYTHON=str(python), NOTIFICATION_ACTION_SCRIPT=str(frontend / "scripts/notification-paired-action.py"))
            try:
                execute("real foundation persistence/browser" if args.foundations else "real notification worker/SSE/browser" if args.notifications else "real requester/reviewer HTTP browser", ["node", "server/browser-backend.spec.mjs"] if args.notifications else ["pnpm", "run", "test:browser-backend"], frontend, browser_env, artifacts / "browser.log")
            except Exception:
                if args.foundation_task == '013' and (temp / 'service.jsonl').exists():
                    partial = (temp / 'service.jsonl').read_bytes()
                    evidence['partial_service_log_sha256'] = hashlib.sha256(partial).hexdigest()
                    evidence['partial_fault_records'] = [
                        {key: record.get(key) for key in ['level', 'event', 'code', 'sqlstate']}
                        for record in (json.loads(line) for line in partial.decode().splitlines() if line.strip())
                        if record.get('level') in {'warning', 'error', 'critical'}]
                raise
            api_process.terminate()
            api_process.wait(timeout=15)
            api_process = None
        diagnostics = []
        structured = temp / "service.jsonl"
        if not structured.exists():
            raise RuntimeError("Missing structured service logging evidence")
        records = [json.loads(line) for line in structured.read_text().splitlines() if line.strip()]
        for index, record in enumerate(records):
            if record.get("level") in {"warning", "error", "critical"}:
                diagnostics.append({"source": "service.jsonl", "line": index + 1,
                                    "level": record["level"], "logger": record.get("logger")})
        evidence["service_log_sha256"] = hashlib.sha256(structured.read_bytes()).hexdigest()
        evidence["service_log_records"] = len(records)
        for filename in ["api.log", "seed.log", "migration.log", *(["worker.log"] if args.notifications or args.foundations else [])]:
            log = (temp / filename).read_text()
            diagnostics.extend({"source": filename, "line": index + 1} for index, line in enumerate(log.splitlines())
                               if re.search(r"^\s*(?:WARNING|ERROR):|\b(?:DeprecationWarning|UserWarning|RuntimeWarning):", line))
        evidence["service_diagnostics"] = diagnostics
        if args.foundation_task == '013':
            expected_faults = [record for record in records if record.get('level') in {'warning', 'error', 'critical'}]
            fault_counts = {event: sum(record.get('event') == event for record in expected_faults)
                            for event in ['database.failure', 'support.recording_unavailable']}
            evidence['expected_fault_records'] = [{'level': record.get('level'), 'event': record.get('event'),
                                                 'code': record.get('code'), 'sqlstate': record.get('sqlstate')}
                                                for record in expected_faults]
            evidence['expected_fault_counts'] = fault_counts
            if fault_counts != {'database.failure': 2, 'support.recording_unavailable': 2} or len(expected_faults) != 4:
                raise RuntimeError('Owned support outage did not produce the exact expected failure evidence')
            if any(item['source'] != 'service.jsonl' for item in diagnostics):
                raise RuntimeError('Unexpected disposable process diagnostics outside the injected support outage')
        elif diagnostics:
            raise RuntimeError("Unexpected disposable service diagnostics")
        backend_source = [(str(path.relative_to(backend)), hashlib.sha256(path.read_bytes()).hexdigest())
                          for path in sorted((backend / "src").rglob("*.py"))]
        evidence["backend_source_sha256"] = hashlib.sha256(json.dumps(backend_source).encode()).hexdigest()
        evidence["backend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=backend, text=True).strip()
        evidence["frontend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=frontend, text=True).strip()
        evidence["backend_source_end_sha256"] = source_identity(backend)
        evidence["frontend_source_end_sha256"] = source_identity(frontend)
        if evidence["backend_source_start_sha256"] != evidence["backend_source_end_sha256"] or evidence["frontend_source_start_sha256"] != evidence["frontend_source_end_sha256"]:
            raise RuntimeError("Source changed during paired acceptance")
        if args.foundations and args.foundation_task in ["016", "021"] and contract_blocked:
            evidence["independent_slice_browser_exit_code"] = 0
            evidence["blocked_at"] = ("full producer reconciliation: GraphBinding.source_schema and GraphStep.field_policy descriptions remain unfrozen"
                                      if args.foundation_task == "021" else "full producer reconciliation: APP-BE-022 step operation metadata remains unfrozen")
            raise RuntimeError("Actual HTTP producer schema drift; independent task browser evidence retained, paired gate failed")
        if snapshot is not None:
            evidence['backend_locale_assets_end'] = {
                name: hashlib.sha256((backend / name).read_bytes()).hexdigest()
                for name in evidence['backend_locale_assets_start']
            }
            if evidence['backend_locale_assets_start'] != evidence['backend_locale_assets_end']:
                raise RuntimeError('Compiled locale assets changed during paired acceptance')
        evidence["exit_code"] = 0
finally:
    if worker_process is not None:
        worker_process.terminate()
        try: worker_process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            worker_process.kill(); worker_process.wait(timeout=5)
    if api_process is not None:
        if args.foundation_task == '015':
            try: os.kill(api_process.pid, signal.SIGCONT)
            except ProcessLookupError: pass
        api_process.terminate()
        try: api_process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            evidence["api_cleanup"] = "owned process exceeded shutdown deadline; killed"
            api_process.kill(); api_process.wait(timeout=5)
    for name in reversed(containers):
        subprocess.run(["docker", "rm", "--force", "--volumes", name], capture_output=True, check=False, timeout=30)
    for artifact in ["browser.log", "browser.json"]:
        path=artifacts / artifact
        if path.exists(): (artifacts / (str(int(evidence["started_at"])) + "-" + artifact)).write_bytes(path.read_bytes())
    if snapshot is not None:
        evidence["backend_peer_source_after_sha256"] = source_identity(peer_backend)
        snapshot.cleanup()
    evidence.setdefault("exit_code", 1)
    evidence["ended_at"] = time.time()
    (artifacts / ("manifest-" + str(int(evidence["started_at"])) + ".json")).write_text(json.dumps(evidence, indent=2) + "\n")
    (artifacts / "manifest.json").write_text(json.dumps(evidence, indent=2) + "\n")

print("Actual notification worker/SSE/browser passed; owned resources removed." if args.notifications else "Real HTTP requester/reviewer smoke passed; owned containers and fixture credentials removed.")
