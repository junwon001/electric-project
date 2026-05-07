import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from schemas import WeatherResponse
from data_repository import get_weather_df, find_exact_row


router = APIRouter()


@router.get("/api/weather", response_model=WeatherResponse)
def get_weather(datetime: str = Query(...)):
    weather_df = get_weather_df()

    if weather_df is None:
        raise HTTPException(
            status_code=500,
            detail="weather 데이터가 로드되지 않았습니다.",
        )

    target = pd.to_datetime(datetime, errors="coerce")

    if pd.isna(target):
        raise HTTPException(
            status_code=400,
            detail="datetime 형식이 올바르지 않습니다.",
        )

    target = target.floor("h")
    row = find_exact_row(weather_df, target)

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="해당 시각의 날씨 데이터가 없습니다.",
        )

    return WeatherResponse(
        datetime=str(row["timestamp"]),
        temperature=None
        if pd.isna(row["temperature"])
        else round(float(row["temperature"]), 1),
        humidity=None
        if pd.isna(row["humidity"])
        else round(float(row["humidity"]), 1),
        wind_speed=None
        if pd.isna(row["wind_speed"])
        else round(float(row["wind_speed"]), 1),
    )