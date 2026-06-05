import re
from app.models.scan import Severity

PATTERNS = {
    "AWS Access Key ID": {
        "regex": re.compile(r"(?i)\b(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://console.aws.amazon.com/iam/home?#/security_credentials"
    },
    "GitHub PAT (Classic)": {
        "regex": re.compile(r"ghp_[0-9a-zA-Z]{36}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://github.com/settings/tokens"
    },
    "GitHub PAT (Fine-Grained)": {
        "regex": re.compile(r"github_pat_[0-9a-zA-Z_]{82}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://github.com/settings/tokens"
    },
    "Stripe Live Secret Key": {
        "regex": re.compile(r"sk_live_[0-9a-zA-Z]{24}"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://dashboard.stripe.com/apikeys"
    },
    "Stripe Test Secret Key": {
        "regex": re.compile(r"sk_test_[0-9a-zA-Z]{24}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://dashboard.stripe.com/test/apikeys"
    },
    "Slack Bot Token": {
        "regex": re.compile(r"xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://api.slack.com/apps"
    },
    "Slack Webhook": {
        "regex": re.compile(r"https://hooks\.slack\.com/services/T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8}/[a-zA-Z0-9_]{24}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://api.slack.com/apps"
    },
    "RSA Private Key": {
        "regex": re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
        "severity": Severity.CRITICAL,
        "revoke_url": "N/A"
    },
    "Generic JWT": {
        "regex": re.compile(r"ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"),
        "severity": Severity.MEDIUM,
        "revoke_url": "N/A"
    },
    "Database URI (Credentials Embedded)": {
        "regex": re.compile(r"(?i)(?:postgres|mysql|mongodb|redis)://[a-zA-Z0-9_]+:[a-zA-Z0-9_!@#$%^&*]+@[a-zA-Z0-9_.-]+:[0-9]+"),
        "severity": Severity.CRITICAL,
        "revoke_url": "N/A"
    }
}