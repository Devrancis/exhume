# Exhume

**Scan GitHub repositories for exposed secrets, credentials, and sensitive data — including the full commit history.**

---

## What This Is

Exhume is a web-based security tool that analyzes GitHub repositories for hardcoded credentials and secrets. It checks not just the current state of a codebase, but also the entire git history — every commit, every branch, every deleted file — because removing a file does not remove it from a repository's history.

The detection layer combines two approaches: regex pattern matching against a library of known secret formats (AWS keys, Stripe tokens, GitHub PATs, database connection strings, private keys, etc.), and Shannon entropy analysis to catch high-entropy strings that don't match any known pattern but are statistically unlikely to be regular code.

Results are surfaced in a dashboard with severity scoring, exact file/line/commit context, and per-finding remediation steps.

---

## The Problem

Developers accidentally commit secrets to GitHub every day. It's not a skill issue — it's a workflow issue. A `git add .` while a `.env` file is sitting in the working directory, a connection string hardcoded during a late debug session, a private key temporarily dropped into a config file. These things happen.

The compounding problem is git history. Even if someone catches the mistake and deletes the file in the next commit, the credential is still fully readable to anyone who checks out that commit or runs `git log -p`. Automated bots scan GitHub continuously, specifically hunting for these patterns. The window between a push and a credential being picked up can be under four minutes.

Exhume is built to let you find these issues before that happens.

---

## Detection Approach

**Pattern matching** — A pattern library covering 50+ known secret formats, each with a regex, severity classification, and a link to the provider's revoke page. Covers AWS, GCP, Azure, GitHub, GitLab, Stripe, Twilio, SendGrid, Mailgun, Slack, Telegram, Discord, database connection strings with embedded credentials, PEM private keys, JWT secrets, and more.

**Entropy analysis** — For strings that don't match any pattern, the scanner calculates Shannon entropy on substrings extracted from assignment statements and quoted values. Strings above a threshold entropy and minimum length are flagged as potential secrets for manual review.

**History traversal** — Using GitPython, the scanner walks the full commit history across all branches, not just HEAD. Findings are deduplicated across commits so the same credential exposed in multiple commits appears as one finding with a list of all occurrences.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI |
| Scanning | GitPython, custom regex engine |
| Job Queue | Redis + background tasks |
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Containerization | Docker, Docker Compose |

---

## Architecture

```
Exhume/
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                 # FastAPI entry, routing, and background tasks
│       ├── models/
│       │   └── scan.py             # Pydantic data schemas
│       └── scanner/
│           ├── engine.py           # Git orchestration and Redis queue worker
│           ├── entropy.py          # Shannon entropy calculation math
│           ├── patterns.py         # Regex dictionary for secret detection
│           └── remediator.py       # Dynamic remediation step generator
│
└── frontend/
    ├── package.json
    ├── components.json             # shadcn/ui strict configuration
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── types/
    │   └── scan.ts                 # TypeScript interfaces mirroring backend
    ├── lib/
    │   └── utils.ts                # Tailwind merge utilities (auto-generated)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                # Landing view & Scan Form
    │   ├── globals.css             # Tailwind base & CSS variables
    │   └── scan/
    │       └── [jobId]/
    │           └── page.tsx        # Real-time polling dashboard view
    └── components/
        ├── FindingsTable.tsx       # Interactive data grid for vulnerabilities and commit context
        ├── RemediationPanel.tsx    # Step-by-step fix instruction UI
        ├── ScanProgress.tsx        # Real-time telemetry and animated scan progress visualizer
        ├── SecretTypeChart.tsx     # Recharts data visualization
        ├── SeverityBadge.tsx       # Color-coded severity logic wrapper
        └── ui/                     # (Atomic Primitive Components)
            ├── badge.tsx
            ├── button.tsx
            ├── card.tsx
            ├── input.tsx
            └── table.tsx
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan` | Submit a repo for scanning. Returns a `job_id` immediately. |
| `GET` | `/api/scan/{job_id}` | Poll scan status and retrieve results when complete. |
| `GET` | `/api/report/{job_id}/pdf` | Download the PDF audit report for a completed scan. |
| `GET` | `/api/health` | Service health check. |

Scans are non-blocking. The frontend polls `/api/scan/{job_id}` every two seconds until the status is `completed` or `failed`.

---

## Severity Levels

| Level | What it covers |
|---|---|
| **Critical** | Cloud provider keys (AWS/GCP/Azure), RSA/EC private keys, database URLs with credentials |
| **High** | Payment processor keys, OAuth tokens, GitHub/GitLab PATs, Slack webhooks |
| **Medium** | Generic API keys, JWT signing secrets, internal service tokens |
| **Low** | High-entropy strings that may be secrets, commented-out credentials |
| **Info** | `.env` file detected in history, missing `.gitignore` patterns |

---

## Getting Started

### Requirements

- Docker and Docker Compose
- Git

### Run Locally

```bash
git clone https://github.com/Devrancis/exhume.git
cd exhume
cp backend/.env.example backend/.env
docker compose up --build
```

Frontend: `http://localhost:3000`  
Backend API: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Environment Variables

**Backend (`backend/.env`)**

```env
REDIS_URL=redis://redis:6379
GITHUB_TOKEN=              # Optional. Required for private repos and to avoid rate limiting.
MAX_REPO_SIZE_MB=500
SCAN_TIMEOUT_SECONDS=300
TEMP_DIR=/tmp/exhume
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`frontend/.env.local`)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Usage

1. Paste a GitHub repository URL into the scan form.
2. Toggle whether to scan the full git history (on by default).
3. Optionally provide a GitHub token for private repos or to avoid API rate limits.
4. Submit the scan. The dashboard updates live as the scanner runs.
5. Review findings by severity. Each finding includes the file path, line number, commit hash if from history, a partially redacted preview of the exposed value, and step-by-step remediation.
6. Export a PDF report if needed.

---

## Project Status

This project is actively being built. Here is what is done and what is still in progress.

**Done**
- Monorepo structure
- Docker Compose setup (backend, frontend, Redis)
- FastAPI application skeleton with routing
- Next.js frontend skeleton with TypeScript
- `.gitignore` and environment config

**In Progress**
- Pattern library (regex definitions for all secret types)
- Shannon entropy detection module
- Git history traversal with GitPython
- Scan pipeline orchestration
- Results dashboard UI
- Severity scoring and remediation copy
- PDF report generation

**Planned**
- Private repo support via GitHub token
- Per-finding occurrence timeline across commits
- Branch-level filtering
- JSON export
- GitHub Actions integration for CI scanning

---

## Notes on Responsible Use

Exhume is built for scanning repositories you own or have explicit authorization to audit. Running it against repositories you do not control is outside the intended scope and may violate GitHub's terms of service.

The tool partially redacts secret values in the UI and never logs raw credential values to disk. When a scan completes, the cloned repository is deleted from the server.

---

## License

MIT — see `LICENSE` for details.

---

Built by [Francis](https://github.com/Devrancis)