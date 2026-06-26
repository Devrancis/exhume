import re
import os

# High-risk files that should NEVER be committed to version control
DANGEROUS_FILES = [
    r"\.env$", r"\.env\.local$", r"\.env\.production$", r"\.env\.development$",
    r"\.pem$", r"\.pkcs12$", r"id_rsa", r"id_dsa", r"wp-config\.php$",
    r"credentials\.json$", r"service-account\.json$"
]

# Hardened patterns matching explicit vendor prefixes (Zero false-positive rule)
TARGETED_RULES = {
    "Slack OAuth Access Token": r"xoxb-[0-9]{11,13}-[a-zA-Z0-9-,]+",
    "Stripe Secret Key": r"sk_live_[0-9a-zA-Z]{24}",
    "Google API Key": r"AIzaSy[a-zA-Z0-9-_]{33}",
    "GitHub Personal Access Token": r"ghp_[a-zA-Z0-9]{36}",
    "AWS Access Key ID": r"AKIA[0-9A-Z]{16}",
    "Generic Private Key Header": r"-----BEGIN [A-Z ]+ PRIVATE KEY-----",
    "Database Connection URI": r"postgresql://\w+:\w+@[\w\.-]+:\d+/\w+",
    "RSA Private Key Signature": r"-----BEGIN RSA PRIVATE KEY-----"
}

def analyze_file(file_path: str, content: str) -> list:
    """
    Executes a high-precision double pass filter over code assets.
    Returns structured metrics to be ingested by Redis.
    """
    findings = []
    filename = os.path.basename(file_path)
    
    # Pass 1: Structural File Violations
    for pattern in DANGEROUS_FILES:
        if re.search(pattern, filename, re.IGNORECASE):
            findings.append({
                "file": file_path,
                "line": 1,
                "type": "Exposed Configuration File",
                "evidence": f"Entire key configuration asset '{filename}' committed.",
                "severity": "CRITICAL"
            })
            return findings

    # Pass 2: Exact Prefix-Based Line Violations
    lines = content.splitlines()
    for line_num, line in enumerate(lines, 1):
        # Prevent tracking massive vendor lockfiles or build artifacts
        if len(line) > 800 or "package-lock.json" in file_path or "yarn.lock" in file_path:
            continue
            
        for rule_name, pattern in TARGETED_RULES.items():
            match = re.search(pattern, line)
            if match:
                # Mask secret tokens to ensure security in reports
                raw_match = match.group(0)
                masked_evidence = raw_match[:10] + "..." + raw_match[-4:] if len(raw_match) > 14 else "Confidential Token"
                
                findings.append({
                    "file": file_path,
                    "line": line_num,
                    "type": rule_name,
                    "evidence": masked_evidence,
                    "severity": "CRITICAL"
                })
    return findings