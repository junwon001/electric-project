VALID_BUILDINGS = {
    "광개토관",
    "대양AI센터",
    "집현관",
    "충무관",
    "학생회관",
}

SUPPORTED_HORIZONS = {48, 168}

VIEW_SPECS = {
    "short": {"horizon": 48},
    "medium": {"horizon": 168},
}

CONTEXT_HOURS = 24 * 85

# 자동 워밍 대상
WARMUP_PERIODS = ["short", "medium"]

"""
장기 포함 버전

SUPPORTED_HORIZONS = {48, 168, 720}

VIEW_SPECS = {
    "short": {"horizon": 48},
    "medium": {"horizon": 168},
    "long": {"horizon": 720},
}

WARMUP_PERIODS = ["short", "medium", "long"]
"""