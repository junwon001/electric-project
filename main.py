from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from constants import CONTEXT_HOURS
from model_loader import load_model_once
from scheduler_service import auto_dashboard_scheduler

from data_repository import (
    WEATHER_FILE,
    ACADEMIC_FILE,
    POWER_FILE,
    load_power_data,
    load_csv_with_fallback_encodings,
    normalize_weather_dataframe,
    normalize_academic_dataframe,
    set_weather_df,
    set_academic_df,
)

from routers.prediction_router import router as prediction_router
from routers.comparison_router import router as comparison_router
from routers.summary_router import router as summary_router
from routers.cache_router import router as cache_router
from routers.auto_router import router as auto_router
from routers.weather_router import router as weather_router
from routers.academic_router import router as academic_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    for pdt in [48, 168]:
        load_model_once(
            prediction_length=pdt,
            context_length=CONTEXT_HOURS,
            patch_size=16,
            num_samples=100,
            batch_size=64,
        )

    if WEATHER_FILE.exists():
        weather_df = normalize_weather_dataframe(
            load_csv_with_fallback_encodings(WEATHER_FILE)
        )
        set_weather_df(weather_df)
        print(f"weather 데이터 로드 완료: {len(weather_df)} rows")

    if ACADEMIC_FILE.exists():
        academic_df = normalize_academic_dataframe(
            load_csv_with_fallback_encodings(ACADEMIC_FILE)
        )
        set_academic_df(academic_df)
        print(f"academic 데이터 로드 완료: {len(academic_df)} rows")

    if POWER_FILE.exists():
        load_power_data()

    auto_task = asyncio.create_task(
        auto_dashboard_scheduler(load_power_data)
    )

    try:
        yield

    finally:
        auto_task.cancel()

        try:
            await auto_task
        except asyncio.CancelledError:
            print("[AUTO SCHEDULER STOPPED]")


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "backend running"
    }


app.include_router(prediction_router)
app.include_router(comparison_router)
app.include_router(summary_router)
app.include_router(cache_router)
app.include_router(auto_router)
app.include_router(weather_router)
app.include_router(academic_router)