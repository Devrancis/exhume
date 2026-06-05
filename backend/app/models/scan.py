from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class ScanRequest(BaseModel):
    repo_url: HttpUrl
    github_token: Optional[str] = None
    scan_history: bool = True
    branches: List[str] = ["main", "master"]

class Finding(BaseModel):
    finding_id: str
    severity: Severity
    secret_type: str
    file_path: str
    line_number: int
    redacted_value: str
    commit_hash: Optional[str] = None
    commit_date: Optional[datetime] = None
    commit_author: Optional[str] = None
    remediation_steps: List[str]

class ScanProgress(BaseModel):
    current_step: str
    percent: int
    files_scanned: int
    commits_traversed: int

class ScanResult(BaseModel):
    job_id: str
    status: str
    progress: ScanProgress
    findings: List[Finding] = []
    error: Optional[str] = None
    total_time_seconds: float = 0.0