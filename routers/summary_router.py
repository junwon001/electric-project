import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from data_repository import load_power_data
from summary_service import build_summary_response


router = APIRouter()


@router.get("/api/summary")
def get_summary(
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

    return build_summary_response(
        df=df,
        target=target,
        period=period,
    )