from functools import lru_cache
from pathlib import Path

import pandas as pd

from constants import VALID_BUILDINGS


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

WEATHER_FILE = DATA_DIR / "seoul_weather.csv"
POWER_FILE = DATA_DIR / "11_building_aggregated.csv"
ACADEMIC_FILE = DATA_DIR / "2026 0325 1351 학사일정 및 시간표 데이터 v0.2.csv"

weather_df = None
academic_df = None


def set_weather_df(df: pd.DataFrame):
    global weather_df
    weather_df = df


def get_weather_df():
    return weather_df


def set_academic_df(df: pd.DataFrame):
    global academic_df
    academic_df = df


def get_academic_df():
    return academic_df


def load_csv_with_fallback_encodings(file_path: Path) -> pd.DataFrame:
    encodings = ["utf-8-sig", "utf-8", "cp949", "euc-kr"]

    last_error = None

    for enc in encodings:
        try:
            return pd.read_csv(file_path, encoding=enc)
        except Exception as e:
            last_error = e

    raise RuntimeError(f"CSV 파일 읽기 실패: {file_path} / {last_error}")


def normalize_timestamp_column(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp",
) -> pd.DataFrame:
    df = df.copy()

    df[timestamp_col] = (
        df[timestamp_col]
        .astype(str)
        .str.strip()
        .str.replace(".", "-", regex=False)
    )

    df[timestamp_col] = pd.to_datetime(df[timestamp_col], errors="coerce")
    df = df.dropna(subset=[timestamp_col])
    df[timestamp_col] = df[timestamp_col].dt.floor("h")

    return df


def normalize_weather_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    rename_map = {}

    for col in df.columns:
        stripped = col.strip()
        lower = stripped.lower()

        if lower in ["timestamp", "datetime", "time", "date"] or stripped in [
            "일시",
            "날짜",
            "시간",
            "측정일시",
            "관측시각",
            "예측시각",
        ]:
            rename_map[col] = "timestamp"

        elif stripped in ["기온", "기온(°C)"] or lower in [
            "temperature",
            "temp",
        ]:
            rename_map[col] = "temperature"

        elif stripped in ["습도", "습도(%)"] or lower in ["humidity"]:
            rename_map[col] = "humidity"

        elif stripped in ["풍속", "풍속(m/s)"] or lower in [
            "wind_speed",
            "windspeed",
            "wind",
        ]:
            rename_map[col] = "wind_speed"

    df = df.rename(columns=rename_map)

    if "timestamp" not in df.columns:
        raise RuntimeError(
            f"weather CSV에 timestamp(datetime/time) 컬럼이 필요합니다. "
            f"현재 컬럼: {list(df.columns)}"
        )

    df = normalize_timestamp_column(df, "timestamp")
    return df


def normalize_academic_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    rename_map = {}

    for col in df.columns:
        stripped = col.strip()
        lower = stripped.lower()

        if lower in ["timestamp", "datetime", "time", "date"] or stripped in [
            "일시",
            "날짜",
            "시간",
            "측정일시",
            "관측시각",
            "예측시각",
        ]:
            rename_map[col] = "timestamp"

        elif stripped == "학사일정":
            rename_map[col] = "학사일정"

        elif stripped == "개강여부":
            rename_map[col] = "개강여부"

        elif stripped == "코로나":
            rename_map[col] = "코로나"

    df = df.rename(columns=rename_map)

    if "timestamp" not in df.columns:
        raise RuntimeError(
            f"academic CSV에 timestamp(datetime/time) 컬럼이 필요합니다. "
            f"현재 컬럼: {list(df.columns)}"
        )

    df = normalize_timestamp_column(df, "timestamp")
    return df


@lru_cache(maxsize=1)
def load_power_data():
    if not POWER_FILE.exists():
        raise FileNotFoundError(f"전력 CSV 파일을 찾을 수 없습니다: {POWER_FILE}")

    df = load_csv_with_fallback_encodings(POWER_FILE)
    df.columns = df.columns.str.strip()

    if "날짜" not in df.columns:
        raise ValueError(
            f"전력 CSV에 '날짜' 컬럼이 없습니다. 현재 컬럼: {list(df.columns)}"
        )

    df["날짜"] = pd.to_datetime(df["날짜"], errors="coerce")
    df = df.dropna(subset=["날짜"]).sort_values("날짜").reset_index(drop=True)

    for col in VALID_BUILDINGS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    print(f"power 데이터 로드 완료: {len(df)} rows")
    return df


def find_exact_row(df: pd.DataFrame, dt: pd.Timestamp):
    matched = df[df["timestamp"] == dt]

    if matched.empty:
        return None

    return matched.iloc[0]