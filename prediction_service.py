import pandas as pd
from fastapi import HTTPException

from constants import VIEW_SPECS
from inference import run_forecast
from cache_service import (
    make_cache_key,
    get_cache_entry,
    set_cache_entry,
)


def build_history_and_forecast(
    df: pd.DataFrame,
    building: str,
    target: pd.Timestamp,
    horizon: int,
    context_hours: int,
):
    history_df = df[df["날짜"] <= target][["날짜", building]].copy()
    history_df = history_df.dropna(subset=[building])

    if history_df.empty:
        raise HTTPException(
            status_code=404,
            detail="선택한 시각 이전의 전력 데이터가 없습니다."
        )

    history_df = history_df.tail(context_hours).copy()
    history_df[building] = pd.to_numeric(history_df[building], errors="coerce")
    history_df = history_df.dropna(subset=[building])

    if history_df.empty:
        raise HTTPException(
            status_code=404,
            detail="예측에 사용할 과거 전력 데이터가 없습니다."
        )

    history_values = history_df[building].astype(float).tolist()

    print("요청 building:", building)
    print("요청 horizon:", horizon)
    print("요청 context_hours:", context_hours)
    print("history len:", len(history_values))

    forecast_values = run_forecast(
        history_values,
        horizon=horizon,
        context_length=context_hours,
    )

    print("forecast len:", len(forecast_values))

    future_times = pd.date_range(
        start=target + pd.Timedelta(hours=1),
        periods=horizon,
        freq="h"
    )

    history_result = history_df.rename(
        columns={"날짜": "time", building: "value"}
    ).copy()

    history_result["value"] = pd.to_numeric(
        history_result["value"],
        errors="coerce"
    )
    history_result = history_result.dropna(subset=["value"])
    history_result["time"] = history_result["time"].dt.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    forecast_result = pd.DataFrame({
        "time": future_times,
        "value": forecast_values
    })

    forecast_result["value"] = pd.to_numeric(
        forecast_result["value"],
        errors="coerce"
    )
    forecast_result = forecast_result.dropna(subset=["value"])
    forecast_result["time"] = forecast_result["time"].dt.strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    return {
        "building": building,
        "datetime": str(target),
        "context_hours": context_hours,
        "horizon": horizon,
        "history": history_result.to_dict(orient="records"),
        "forecast": forecast_result.to_dict(orient="records"),
    }


def init_cache_entry(building: str, dt_str: str, context_hours: int):
    return {
        "building": building,
        "datetime": dt_str,
        "context_hours": context_hours,
        "short_status": "not_requested",
        "medium_status": "not_requested",
        "short": None,
        "medium": None,
    }


def get_or_create_forecast(
    df: pd.DataFrame,
    building: str,
    target: pd.Timestamp,
    period: str,
    context_hours: int,
):
    """
    개별/비교/종합 탭에서 공통으로 사용하는 Redis 기반 예측 캐시 함수
    period: short | medium
    """
    if period not in VIEW_SPECS:
        raise HTTPException(
            status_code=400,
            detail="period는 short, medium 중 하나여야 합니다."
        )

    target = target.floor("h")
    target_str = str(target)

    cache_key = make_cache_key(building, target_str, context_hours)
    cache_entry = get_cache_entry(cache_key)

    if cache_entry is None:
        cache_entry = init_cache_entry(
            building,
            target_str,
            context_hours,
        )
        set_cache_entry(cache_key, cache_entry)

    status_key = f"{period}_status"

    # 이미 계산 완료
    if cache_entry.get(period) is not None:
        print(f"[REDIS CACHE HIT] {cache_key} / {period}")
        return cache_entry[period], "done"

    # 이미 계산 중이면 중복 계산 방지
    if cache_entry.get(status_key) == "loading":
        print(f"[REDIS CACHE LOADING] {cache_key} / {period}")
        return None, "loading"

    # 새로 계산
    print(f"[REDIS CACHE MISS] {cache_key} / {period}")
    cache_entry[status_key] = "loading"
    set_cache_entry(cache_key, cache_entry)

    horizon = VIEW_SPECS[period]["horizon"]

    try:
        result = build_history_and_forecast(
            df=df,
            building=building,
            target=target,
            horizon=horizon,
            context_hours=context_hours,
        )

        latest_cache_entry = get_cache_entry(cache_key)

        if latest_cache_entry is None:
            latest_cache_entry = init_cache_entry(
                building,
                target_str,
                context_hours,
            )

        latest_cache_entry[period] = result
        latest_cache_entry[status_key] = "done"

        set_cache_entry(cache_key, latest_cache_entry)

        return result, "done"

    except Exception:
        latest_cache_entry = get_cache_entry(cache_key)

        if latest_cache_entry is None:
            latest_cache_entry = init_cache_entry(
                building,
                target_str,
                context_hours,
            )

        latest_cache_entry[status_key] = "error"
        set_cache_entry(cache_key, latest_cache_entry)

        raise