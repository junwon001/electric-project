import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from data_repository import load_power_data
from comparison_service import build_comparison_response


router = APIRouter()


@router.get("/api/comparison")
def get_comparison(
    datetime: str = Query(...),
    period: str = Query("short"),
):
    target = pd.to_datetime(datetime, errors="coerce")

    if pd.isna(target):
        raise HTTPException(
            status_code=400,
            detail="datetime 형식이 올바르지 않습니다.",
        )

    df = load_power_data()

    return build_comparison_response(
        df=df,
        target=target,
        period=period,
    )