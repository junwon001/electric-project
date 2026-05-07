import pandas as pd
from fastapi import HTTPException

from constants import VALID_BUILDINGS, VIEW_SPECS, CONTEXT_HOURS
from prediction_service import get_or_create_forecast


def build_summary_response(
    df: pd.DataFrame,
    target: pd.Timestamp,
    period: str,
):
    """
    종합 분석 응답 생성
    - 5개 건물의 예측 결과를 조회
    - 건물별 합계/평균/최대/최소 계산
    - 전체 합계, 건물당 평균, 최대 사용 건물 계산
    """
    target = target.floor("h")

    if period not in VIEW_SPECS:
        raise HTTPException(
            status_code=400,
            detail="period는 short, medium 중 하나여야 합니다.",
        )

    target_str = str(target)
    horizon = VIEW_SPECS[period]["horizon"]

    building_summaries = {}
    total_forecast_sum = 0.0
    valid_building_count = 0

    max_building = None
    max_building_total = None

    for building in sorted(list(VALID_BUILDINGS)):
        if building not in df.columns:
            building_summaries[building] = {
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

            if status == "loading" or forecast_data is None:
                building_summaries[building] = {
                    "status": "loading",
                    "total_forecast": None,
                    "avg_forecast": None,
                    "max_forecast": None,
                    "min_forecast": None,
                }
                continue

            forecast_values = [
                float(item["value"])
                for item in forecast_data["forecast"]
                if item.get("value") is not None
            ]

            if len(forecast_values) == 0:
                building_summaries[building] = {
                    "status": "error",
                    "error": "예측값이 비어 있습니다.",
                }
                continue

            building_total = sum(forecast_values)
            building_avg = building_total / len(forecast_values)
            building_max = max(forecast_values)
            building_min = min(forecast_values)

            building_summaries[building] = {
                "status": "done",
                "total_forecast": round(building_total, 3),
                "avg_forecast": round(building_avg, 3),
                "max_forecast": round(building_max, 3),
                "min_forecast": round(building_min, 3),
                "horizon": horizon,
            }

            total_forecast_sum += building_total
            valid_building_count += 1

            if max_building_total is None or building_total > max_building_total:
                max_building_total = building_total
                max_building = building

        except Exception as e:
            building_summaries[building] = {
                "status": "error",
                "error": str(e),
            }

    avg_total_per_building = (
        total_forecast_sum / valid_building_count
        if valid_building_count > 0
        else None
    )

    return {
        "datetime": target_str,
        "period": period,
        "horizon": horizon,
        "context_hours": CONTEXT_HOURS,
        "summary": {
            "valid_building_count": valid_building_count,
            "total_forecast_sum": round(total_forecast_sum, 3),
            "avg_total_per_building": None
            if avg_total_per_building is None
            else round(avg_total_per_building, 3),
            "max_usage_building": max_building,
            "max_usage_building_total": None
            if max_building_total is None
            else round(max_building_total, 3),
        },
        "buildings": building_summaries,
    }