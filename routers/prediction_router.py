import pandas as pd
from fastapi import APIRouter, HTTPException

from schemas import (
    PredictRequest,
    PredictResponse,
    PredictCacheRequest,
    PredictCacheResponse,
)

from constants import VALID_BUILDINGS, SUPPORTED_HORIZONS, VIEW_SPECS
from data_repository import load_power_data
from cache_service import make_cache_key, get_cache_entry, set_cache_entry
from prediction_service import (
    build_history_and_forecast,
    init_cache_entry,
    get_or_create_forecast,
)


router = APIRouter()


@router.post("/api/power/predict", response_model=PredictResponse)
def predict_power(request: PredictRequest):
    building = request.building
    horizon = request.horizon
    context_hours = request.context_hours

    if building == "종합 분석":
        raise HTTPException(
            status_code=400,
            detail="종합 분석은 예측 API에서 지원하지 않습니다.",
        )

    if building not in VALID_BUILDINGS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 건물명입니다. 사용 가능: {sorted(list(VALID_BUILDINGS))}",
        )

    target = pd.to_datetime(request.datetime, errors="coerce")

    if pd.isna(target):
        raise HTTPException(
            status_code=400,
            detail="datetime 형식이 올바르지 않습니다.",
        )

    target = target.floor("h")

    if horizon not in SUPPORTED_HORIZONS:
        raise HTTPException(
            status_code=400,
            detail="horizon은 48(단기), 168(중기)만 지원합니다.",
        )

    df = load_power_data()

    if building not in df.columns:
        raise HTTPException(
            status_code=500,
            detail=f"전력 CSV에 '{building}' 컬럼이 없습니다.",
        )

    return build_history_and_forecast(
        df=df,
        building=building,
        target=target,
        horizon=horizon,
        context_hours=context_hours,
    )


@router.post("/api/power/predict_cached", response_model=PredictCacheResponse)
def predict_power_cached(request: PredictCacheRequest):
    building = request.building
    context_hours = request.context_hours
    view_type = request.view_type

    if building == "종합 분석":
        raise HTTPException(
            status_code=400,
            detail="종합 분석은 현재 개별 예측 API에서 지원하지 않습니다.",
        )

    if building not in VALID_BUILDINGS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 건물명입니다. 사용 가능: {sorted(list(VALID_BUILDINGS))}",
        )

    if view_type not in VIEW_SPECS:
        raise HTTPException(
            status_code=400,
            detail="view_type은 short, medium 중 하나여야 합니다.",
        )

    target = pd.to_datetime(request.datetime, errors="coerce")

    if pd.isna(target):
        raise HTTPException(
            status_code=400,
            detail="datetime 형식이 올바르지 않습니다.",
        )

    target = target.floor("h")
    target_str = str(target)

    df = load_power_data()

    if building not in df.columns:
        raise HTTPException(
            status_code=500,
            detail=f"전력 CSV에 '{building}' 컬럼이 없습니다.",
        )

    cache_key = make_cache_key(
        building=building,
        dt_str=target_str,
        context_hours=context_hours,
    )

    cache_entry = get_cache_entry(cache_key)

    if cache_entry is None:
        cache_entry = init_cache_entry(
            building=building,
            dt_str=target_str,
            context_hours=context_hours,
        )
        set_cache_entry(cache_key, cache_entry)

    get_or_create_forecast(
        df=df,
        building=building,
        target=target,
        period=view_type,
        context_hours=context_hours,
    )

    latest_cache_entry = get_cache_entry(cache_key)

    if latest_cache_entry is None:
        raise HTTPException(
            status_code=500,
            detail="Redis 캐시 조회에 실패했습니다.",
        )

    return latest_cache_entry