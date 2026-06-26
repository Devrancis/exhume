import re
from app.models.scan import Severity

# High-confidence, zero false-positive detection rules
PATTERNS = {
    "Slack OAuth Access Token": {
        "regex": re.compile(r"xoxb-[0-9]{11,13}-[a-zA-Z0-9-,]+"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://api.slack.com/authentication/token-types"
    },
    "Stripe Secret Key": {
        "regex": re.compile(r"sk_live_[0-9a-zA-Z]{24}"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://dashboard.stripe.com/apikeys"
    },
    "Google API Key": {
        "regex": re.compile(r"AIzaSy[a-zA-Z0-9-_]{33}"),
        "severity": Severity.HIGH,
        "revoke_url": "https://console.cloud.google.com/apis/credentials"
    },
    "GitHub Personal Access Token": {
        "regex": re.compile(r"ghp_[a-zA-Z0-9]{36}"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://github.com/settings/tokens"
    },
    "AWS Access Key ID": {
        "regex": re.compile(r"AKIA[0-9A-Z]{16}"),
        "severity": Severity.CRITICAL,
        "revoke_url": "https://console.aws.amazon.com/iam/home?#/security_credentials"
    },
    "Generic RSA Private Key": {
        "regex": re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
        "severity": Severity.CRITICAL,
        "revoke_url": "N/A - Rotate the key pair immediately"
    },
    "Exposed Environment File": {
        # This catches any mention of common env file formats being hardcoded
        "regex": re.compile(r"(?i)\.(env|pem|pkcs12|p12)$"),
        "severity": Severity.CRITICAL,
        "revoke_url": "N/A - Remove file from version control via .gitignore"
    }
}