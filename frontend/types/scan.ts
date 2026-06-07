export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface Finding {
  finding_id: string;
  severity: Severity;
  secret_type: string;
  file_path: string;
  line_number: number;
  redacted_value: string;
  commit_hash?: string;
  commit_date?: string;
  commit_author?: string;
  remediation_steps: string[];
}

export interface ScanProgress {
  current_step: string;
  percent: number;
  files_scanned: number;
  commits_traversed: number;
}

export interface ScanResult {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: ScanProgress;
  findings?: Finding[];
  error?: string;
  total_time_seconds?: number;
}