import pandas as pd
from fastapi import HTTPException

from constants import VALID_BUILDINGS, VIEW_SPECS, CONTEXT_HOURS
from prediction_service import get_or_create_forecast


def build_comparison_response(
    df: pd.DataFrame,
    target: pd.Timestamp,
    period: str,
):
    """
    비교 분석 응답 생성
    - 5개 건물의 예측 결과를 조회
    - Redis 캐시가 있으면 재사용
    - 없으면 예측 후 Redis에 저장
    """
    target = target.floor("h")

    if period not in VIEW_SPECS:
        raise HTTPException(
            status_code=400,
            detail="period는 short, medium 중 하나여야 합니다.",
        )

    target_str = str(target)
    horizon = VIEW_SPECS[period]["horizon"]

    result = {
        "datetime": target_str,
        "period": period,
        "horizon": horizon,
        "context_hours": CONTEXT_HOURS,
        "buildings": {},
    }

    for building in sorted(list(VALID_BUILDINGS)):
        if building not in df.columns:
            result["buildings"][building] = {
                "status": "error",
                "error": f"전력 CSV에 '{building}' 컬럼이 없습니다.",
            }
            continue

        try:
            forecast_data, status = get_or_create_forecast(
                df=df,
                building=building,
                target=target,
                period=period,
                context_hours=CONTEXT_HOURS,
            )

            if status == "loading":
                result["buildings"][building] = {
                    "status": "loading",
                    "data": None,
                }
            else:
                result["buildings"][building] = {
                    "status": "done",
                    "data": forecast_data,
                }

        except Exception as e:
            result["buildings"][building] = {
                "status": "error",
                "error": str(e),
            }

    return result