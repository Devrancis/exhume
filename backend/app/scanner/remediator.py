from typing import List

def generate_remediation(secret_type: str, file_path: str, revoke_url: str) -> List[str]:
    steps = []
    if revoke_url != "N/A":
        steps.append(f"Immediately revoke/rotate the credential at: {revoke_url}")
    else:
        steps.append("Identify the source of this credential and revoke it immediately.")
    
    steps.append(f"Remove the file from git history: `git filter-repo --path {file_path} --invert-paths`")
    steps.append(f"Add the pattern to your .gitignore: `echo '{file_path}' >> .gitignore`")
    steps.append("Refactor the code to use environment variables (e.g., `os.getenv('SECRET_NAME')`).")
    steps.append("Enable GitHub Secret Scanning to prevent future leaks: https://docs.github.com/en/code-security/secret-scanning")
    
    return steps