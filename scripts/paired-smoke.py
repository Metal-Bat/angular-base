"""Run the existing real HTTP browser journey against owned disposable services."""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--backend-root", default=os.getenv("DELIVERY_BACKEND_ROOT"))
args = parser.parse_args()
if not args.backend_root:
    raise SystemExit("Set DELIVERY_BACKEND_ROOT or --backend-root; no mock fallback is allowed.")
backend = Path(args.backend_root).resolve()
frontend = Path(__file__).resolve().parent.parent
python = backend / ".venv/bin/python"
if not python.exists():
    raise SystemExit("The selected backend virtualenv is required.")

containers = []
api_process = None
artifacts = frontend / "artifacts/paired-smoke"
artifacts.mkdir(parents=True, exist_ok=True)
evidence = {"started_at": time.time(), "evidence": "real HTTP / disposable services", "commands": [],
            "browser_version": subprocess.check_output([os.getenv("FIREFOX_BINARY", "firefox"), "--version"], text=True).strip(),
            "limits": ["No worker/provider/deployment/manual accessibility acceptance", "C02-C13 new producer APIs are consumed by their owning tasks"]}


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
    docker("run", "--detach", "--rm", "--pull=never", "--name", name, "--cpus=1", "--memory=512m",
           "-p", f"127.0.0.1::{port}", *(["--entrypoint", "dragonfly"] if label == "cache" else []), *sum((["-e", value] for value in variables), []), image, *command)
    host_port = docker("port", name, str(port)).rsplit(":", 1)[1]
    return name, host_port


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
               "CELERY_BROKER_URL": "amqp://guest:guest@127.0.0.1:59999/disposable",
               "S3_ENDPOINT": f"http://127.0.0.1:{storage_port}", "S3_ACCESS_KEY": "disposable-access",
               "S3_SECRET_KEY": "disposable-secret", "S3_BUCKET": "frontend-disposable",
               "LOG_FILE": str(temp / "service.jsonl"), "LOG_OUTPUTS": '["file"]',
               "OTEL_TRACES_EXPORTER": "none", "OTEL_METRICS_EXPORTER": "none", "OTEL_LOGS_EXPORTER": "none",
               "BROWSER_ACCOUNTS_FILE": str(temp / "accounts.json")}
        execute("migrate owned database", [str(python), "-m", "alembic", "upgrade", "head"], backend, env, temp / "migration.log")
        execute("seed existing browser journey", [str(python), "scripts/seed_frontend_browser.py"], backend, env, temp / "seed.log")
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
            if actual != expected:
                evidence["blocked_at"] = "actual HTTP contract reconciliation; browser not started"
                raise RuntimeError("Actual HTTP producer schema drift")
            browser_env = {**os.environ, "BACKEND_BROWSER_ORIGIN": origin,
                           "BACKEND_BROWSER_ACCOUNTS": str(temp / "accounts.json"),
                           "BROWSER_REPORT_PATH": str(artifacts / "browser.json")}
            execute("real requester/reviewer HTTP browser", ["npm", "run", "test:browser-backend"], frontend, browser_env, artifacts / "browser.log")
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
        for filename in ["api.log", "seed.log", "migration.log"]:
            log = (temp / filename).read_text()
            diagnostics.extend({"source": filename, "line": index + 1} for index, line in enumerate(log.splitlines())
                               if re.search(r"^\s*(?:WARNING|ERROR):|\b(?:DeprecationWarning|UserWarning|RuntimeWarning):", line))
        evidence["service_diagnostics"] = diagnostics
        if diagnostics:
            raise RuntimeError("Unexpected disposable service diagnostics")
        backend_source = [(str(path.relative_to(backend)), hashlib.sha256(path.read_bytes()).hexdigest())
                          for path in sorted((backend / "src").rglob("*.py"))]
        evidence["backend_source_sha256"] = hashlib.sha256(json.dumps(backend_source).encode()).hexdigest()
        evidence["backend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=backend, text=True).strip()
        evidence["frontend_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=frontend, text=True).strip()
        evidence["exit_code"] = 0
finally:
    if api_process is not None:
        api_process.terminate()
        api_process.wait(timeout=15)
    for name in reversed(containers):
        subprocess.run(["docker", "rm", "--force", "--volumes", name], capture_output=True, check=False, timeout=30)
    evidence.setdefault("exit_code", 1)
    evidence["ended_at"] = time.time()
    (artifacts / "manifest.json").write_text(json.dumps(evidence, indent=2) + "\n")

print("Real HTTP requester/reviewer smoke passed; owned containers and fixture credentials removed.")
