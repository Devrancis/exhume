import os
import shutil
import uuid
import time
from git import Repo
import redis
import json
from pydantic import HttpUrl
from app.models.scan import ScanResult, ScanProgress, Finding, Severity
from app.scanner.patterns import PATTERNS
from app.scanner.entropy import detect_high_entropy_string
from app.scanner.remediator import generate_remediation

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/exhume")

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)

def redact_secret(secret: str) -> str:
    if len(secret) <= 8:
        return "***"
    return f"{secret[:4]}***{secret[-4:]}"

def run_scan_job(job_id: str, repo_url: str, scan_history: bool, token: str = None):
    start_time = time.time()
    repo_dir = os.path.join(TEMP_DIR, job_id)
    findings = []
    
    def update_progress(step: str, pct: int, files: int, commits: int):
        prog = ScanProgress(current_step=step, percent=pct, files_scanned=files, commits_traversed=commits)
        state = {"job_id": job_id, "status": "running", "progress": prog.model_dump(), "findings": [f.model_dump() for f in findings]}
        r.set(f"job:{job_id}", json.dumps(state))

    try:
        # 1. Clone
        update_progress("Cloning repository...", 10, 0, 0)
        clone_url = str(repo_url)
        if token:
            clone_url = clone_url.replace("https://", f"https://{token}@")
        repo = Repo.clone_from(clone_url, repo_dir)
        
        # 2. File Scan (HEAD)
        update_progress("Scanning current files...", 30, 0, 0)
        files_scanned = 0
        for root, dirs, files in os.walk(repo_dir):
            if ".git" in root: continue
            for file in files:
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, repo_dir)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            # Regex Patterns
                            for sec_type, config in PATTERNS.items():
                                matches = config["regex"].findall(line)
                                for match in matches:
                                    val = match if isinstance(match, str) else match[0]
                                    findings.append(Finding(
                                        finding_id=str(uuid.uuid4()), severity=config["severity"], secret_type=sec_type,
                                        file_path=rel_path, line_number=line_num, redacted_value=redact_secret(val),
                                        remediation_steps=generate_remediation(sec_type, rel_path, config["revoke_url"])
                                    ))
                            # Entropy Analysis
                            high_ent = detect_high_entropy_string(line)
                            if high_ent:
                                findings.append(Finding(
                                    finding_id=str(uuid.uuid4()), severity=Severity.MEDIUM, secret_type="High Entropy String",
                                    file_path=rel_path, line_number=line_num, redacted_value=redact_secret(high_ent),
                                    remediation_steps=generate_remediation("High Entropy", rel_path, "N/A")
                                ))
                except UnicodeDecodeError:
                    pass # Skip binary files
                files_scanned += 1

        commits_traversed = 0
        # 3. History Scan
        if scan_history:
            update_progress("Traversing git history...", 60, files_scanned, 0)
            for commit in repo.iter_commits('--all'):
                commits_traversed += 1
                if commits_traversed % 100 == 0:
                    update_progress("Traversing git history...", 60 + int((commits_traversed/1000)*30), files_scanned, commits_traversed)
                
                if not commit.parents: continue
                diffs = commit.parents[0].diff(commit, create_patch=True)
                for diff in diffs:
                    if not diff.diff: continue
                    try:
                        diff_text = diff.diff.decode('utf-8')
                        rel_path = diff.b_path or diff.a_path
                        line_num = 0
                        for line in diff_text.split('\n'):
                            if line.startswith('+') and not line.startswith('+++'):
                                content = line[1:]
                                for sec_type, config in PATTERNS.items():
                                    if config["regex"].search(content):
                                        findings.append(Finding(
                                            finding_id=str(uuid.uuid4()), severity=config["severity"], secret_type=sec_type,
                                            file_path=rel_path, line_number=0, redacted_value="[REDACTED_FROM_HISTORY]",
                                            commit_hash=commit.hexsha, commit_date=commit.committed_datetime, commit_author=commit.author.name,
                                            remediation_steps=generate_remediation(sec_type, rel_path, config["revoke_url"])
                                        ))
                    except UnicodeDecodeError:
                        pass
        
        # 4. Cleanup & Complete
        shutil.rmtree(repo_dir, ignore_errors=True)
        final_state = ScanResult(
            job_id=job_id, status="completed",
            progress=ScanProgress(current_step="Done", percent=100, files_scanned=files_scanned, commits_traversed=commits_traversed),
            findings=findings, total_time_seconds=round(time.time() - start_time, 2)
        )
        r.set(f"job:{job_id}", final_state.model_dump_json())

    except Exception as e:
        shutil.rmtree(repo_dir, ignore_errors=True)
        err_prog = ScanProgress(current_step="Failed", percent=100, files_scanned=0, commits_traversed=0)
        r.set(f"job:{job_id}", json.dumps({"job_id": job_id, "status": "failed", "progress": err_prog.model_dump(), "error": str(e)}))