import pandas as pd
from fastapi import APIRouter

from scheduler_service import get_current_auto_base_datetime


router = APIRouter()


@router.get("/api/auto_base_time")
def get_auto_base_time():
    now = pd.Timestamp.now()
    now_hour = now.floor("h")
    base_time = get_current_auto_base_datetime()

    return {
        "actual_now": str(now),
        "actual_now_hour": str(now_hour),
        "base_datetime": str(base_time),
        "description": "자동 대시보드 기준 시각은 현재 시각을 정각으로 내림 처리한 뒤 1년을 뺀 값입니다.",
    }