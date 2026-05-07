import pandas as pd
from gluonts.dataset.pandas import PandasDataset

from model_loader import get_model_bundle


def run_forecast(history_values, horizon: int, context_length: int = 24 * 85):
    """
    history_values: 과거 실측값 리스트
    horizon: 예측 길이 (48, 168, 720)
    context_length: 입력 길이 최대치
    """
    bundle = get_model_bundle(
        prediction_length=horizon,
        context_length=context_length,
    )
    predictor = bundle["predictor"]

    if not history_values:
        return [0.0] * horizon

    values = []
    for v in history_values:
        if v is None:
            continue
        try:
            values.append(float(v))
        except Exception:
            continue

    if len(values) == 0:
        return [0.0] * horizon

    if len(values) > context_length:
        values = values[-context_length:]

    start_time = pd.Timestamp("2026-01-01 00:00:00")
    df = pd.DataFrame(
        {
            "item_id": ["series_1"] * len(values),
            "timestamp": pd.date_range(start=start_time, periods=len(values), freq="h"),
            "target": values,
        }
    )

    ds = PandasDataset.from_long_dataframe(
        df,
        item_id="item_id",
        timestamp="timestamp",
        target="target",
        freq="h",
    )

    forecasts = list(predictor.predict(ds))

    if len(forecasts) == 0:
        last_val = float(values[-1])
        return [last_val] * horizon

    fc = forecasts[0]

    pred = None

    try:
        pred = fc.quantile(0.5)
    except Exception:
        try:
            pred = fc.quantile("0.5")
        except Exception:
            pass

    if pred is None:
        try:
            pred = fc.mean
        except Exception:
            pred = None

    if pred is None:
        last_val = float(values[-1])
        return [last_val] * horizon

    pred = [float(x) for x in pred]

    if len(pred) >= horizon:
        return pred[:horizon]

    if len(pred) == 0:
        last_val = float(values[-1])
        return [last_val] * horizon

    last_val = float(pred[-1])
    pred.extend([last_val] * (horizon - len(pred)))
    return pred