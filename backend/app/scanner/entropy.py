import math
import re
from typing import Optional

def calculate_shannon_entropy(data: str) -> float:
    """
    Calculates Shannon Entropy based on the formula:
    $$H = -\sum_{i} (p_i \cdot \log_2(p_i))$$
    """
    if not data:
        return 0.0
    entropy = 0.0
    for x in set(data):
        p_x = float(data.count(x)) / len(data)
        if p_x > 0:
            entropy += - p_x * math.log2(p_x)
    return entropy

def detect_high_entropy_string(line: str) -> Optional[str]:
    string_match = re.search(r'["\']([^"\']{20,})["\']', line)
    if string_match:
        candidate = string_match.group(1)
        # Filter out common false positives
        if " " in candidate or "<svg" in candidate:
            return None
        
        entropy = calculate_shannon_entropy(candidate)
        if entropy > 4.5:
            return candidate
    return None