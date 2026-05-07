import asyncio
import pandas as pd

from constants import VALID_BUILDINGS, CONTEXT_HOURS, WARMUP_PERIODS
from prediction_service import get_or_create_forecast


is_auto_warming = False


def get_current_auto_base_datetime() -> pd.Timestamp:
    """
    자동 대시보드 기준 시각 생성
    - 현재 시각을 정각으로 내림
    - 데이터 기준 시점에 맞추기 위해 1년 차감
    - 결과는 항상 HH:00:00
    """
    now_hour = pd.Timestamp.now().floor("h")
    base_time = now_hour - pd.DateOffset(years=1)
    return base_time.floor("h")


def should_skip_startup_warmup(threshold_seconds: int = 60) -> bool:
    """
    다음 정각까지 threshold_seconds 이하로 남았으면
    서버 시작 직후 워밍을 생략한다.
    """
    now = pd.Timestamp.now()
    next_hour = now.floor("h") + pd.Timedelta(hours=1)
    delay_seconds = (next_hour - now).total_seconds()

    return delay_seconds <= threshold_seconds


def warmup_auto_dashboard_cache(load_power_data):
    """
    자동 대시보드용 Redis 캐시 사전 생성

    기준:
    - 현재 시각을 정각으로 내림
    - 1년 전 시각을 base_datetime으로 사용
    - 전체 건물 short, medium 예측을 Redis에 저장
    """
    global is_auto_warming

    if is_auto_warming:
        print("[AUTO WARMUP SKIP] 이미 자동 워밍이 진행 중입니다.")
        return

    is_auto_warming = True

    try:
        target = get_current_auto_base_datetime()
        context_hours = CONTEXT_HOURS
        periods = WARMUP_PERIODS

        print(f"[AUTO WARMUP START] target={target}, periods={periods}")

        df = load_power_data()

        for period in periods:
            for building in sorted(list(VALID_BUILDINGS)):
                if building not in df.columns:
                    print(f"[AUTO WARMUP SKIP] {building}: 전력 CSV 컬럼 없음")
                    continue

                try:
                    forecast_data, status = get_or_create_forecast(
                        df=df,
                        building=building,
                        target=target,
                        period=period,
                        context_hours=context_hours,
                    )

                    print(f"[AUTO WARMUP] {building} / {period} / status={status}")

                except Exception as e:
                    print(f"[AUTO WARMUP ERROR] {building} / {period}: {e}")

        print(f"[AUTO WARMUP DONE] target={target}, periods={periods}")

    finally:
        is_auto_warming = False


async def auto_dashboard_scheduler(load_power_data):
    """
    서버 시작 후 백그라운드에서 자동 캐시를 생성하고,
    이후 매 정각마다 자동 대시보드 캐시를 갱신하는 내부 스케줄러
    """
    await asyncio.sleep(1)

    if should_skip_startup_warmup(threshold_seconds=60):
        print("[AUTO WARMUP SKIP] 다음 정각까지 1분 이하이므로 시작 워밍을 생략합니다.")
    else:
        asyncio.create_task(
            asyncio.to_thread(
                warmup_auto_dashboard_cache,
                load_power_data,
            )
        )

    while True:
        now = pd.Timestamp.now()
        next_hour = now.floor("h") + pd.Timedelta(hours=1)
        delay_seconds = max((next_hour - now).total_seconds(), 1)

        print(
            f"[AUTO SCHEDULER] next update at {next_hour}, "
            f"delay={delay_seconds:.1f}s"
        )

        await asyncio.sleep(delay_seconds)

        asyncio.create_task(
            asyncio.to_thread(
                warmup_auto_dashboard_cache,
                load_power_data,
            )
        )