"""Read-only capability report; this does not certify runner isolation."""

import argparse
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import urllib.request


def command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=8)
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def ollama_models():
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open("http://127.0.0.1:11434/api/tags", timeout=3) as response:
            return [model["name"] for model in json.load(response)["models"]]
    except (OSError, ValueError, KeyError, TypeError):
        return None


def report(github=False):
    memory = {}
    if Path("/proc/meminfo").exists():
        for line in Path("/proc/meminfo").read_text().splitlines():
            key, value = line.split(":", 1)
            if key in ("MemTotal", "MemAvailable", "SwapTotal", "SwapFree"):
                memory[key] = int(value.split()[0]) * 1024
    disk = shutil.disk_usage(".")
    versions = {}
    for name, args in {
        "node": ["node", "--version"], "npm": ["npm", "--version"],
        "python": ["python3", "--version"], "git": ["git", "--version"],
        "gh": ["gh", "--version"], "postgres_client": ["psql", "--version"],
        "ffmpeg": ["ffmpeg", "-version"], "ollama": ["ollama", "--version"],
    }.items():
        output = command(args)
        match = re.search(r"\d+\.\d+(?:\.\d+)?", output or "")
        versions[name] = match.group() if match else None
    docker = command(["docker", "info", "--format", "{{.ServerVersion}}|{{.OperatingSystem}}|{{.NCPU}}|{{.MemTotal}}"])
    gpu = command(["nvidia-smi", "--query-gpu=name,driver_version,memory.total,memory.used", "--format=csv,noheader,nounits"])
    result = {
        "isolation_verified": False,
        "os": platform.freedesktop_os_release().get("PRETTY_NAME", platform.system()) if hasattr(platform, "freedesktop_os_release") and Path("/etc/os-release").exists() else platform.system(),
        "kernel": platform.release(), "cpu_threads": os.cpu_count(),
        "load_average": os.getloadavg() if hasattr(os, "getloadavg") else None,
        "memory_bytes": memory, "disk_free_bytes": disk.free,
        "disk_at_least_10_gib": disk.free >= 10 * 1024**3,
        "virtualization": command(["systemd-detect-virt"]),
        "windows_drive_mounted": os.path.ismount("/mnt/c"),
        "docker": docker, "gpu": gpu.splitlines() if gpu else None,
        "ollama_models": ollama_models(), "tool_versions": versions,
    }
    if Path("/proc/cpuinfo").exists():
        result["cpu_model"] = next((line.split(":", 1)[1].strip() for line in Path("/proc/cpuinfo").read_text().splitlines() if line.startswith("model name")), None)
    if github:
        raw = command(["gh", "api", "repos/harmonie-joy/Luxe/actions/runners", "--jq", "{total_count,states:[.runners[]|{status,busy,labels:[.labels[].name]}]}"])
        try:
            result["github_runners"] = json.loads(raw) if raw else None
        except ValueError:
            result["github_runners"] = None
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--github", action="store_true", help="Read repository runner states with existing gh authentication")
    print(json.dumps(report(parser.parse_args().github), indent=2))
