from pathlib import Path
import torch

from uni2ts.model.moirai_moe import MoiraiMoEForecast, MoiraiMoEModule


_model_store = {}
BASE_DIR = Path(__file__).resolve().parent
MODEL_CACHE_DIR = BASE_DIR / "model_cache"
MODEL_CACHE_DIR.mkdir(exist_ok=True)

MODEL_ID = "Salesforce/moirai-moe-1.0-R-base"


def load_model_once(
    prediction_length: int,
    context_length: int = 24 * 85,
    patch_size: int = 16,
    num_samples: int = 100,
    batch_size: int = 64,
):
    key = f"pdt_{prediction_length}_ctx_{context_length}_psz_{patch_size}_ns_{num_samples}_bsz_{batch_size}"

    if key in _model_store:
        return _model_store[key]

    print(f"모델 로딩 시작... prediction_length={prediction_length}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"사용 디바이스: {device}")

    module = MoiraiMoEModule.from_pretrained(
        MODEL_ID,
        cache_dir=str(MODEL_CACHE_DIR),
    )

    model = MoiraiMoEForecast(
        module=module,
        prediction_length=prediction_length,
        context_length=context_length,
        patch_size=patch_size,
        num_samples=num_samples,
        target_dim=1,
        feat_dynamic_real_dim=0,
        past_feat_dynamic_real_dim=0,
    )

    predictor = model.create_predictor(batch_size=batch_size)

    bundle = {
        "model": model,
        "predictor": predictor,
        "device": device,
        "prediction_length": prediction_length,
        "context_length": context_length,
        "patch_size": patch_size,
        "num_samples": num_samples,
        "batch_size": batch_size,
    }

    _model_store[key] = bundle
    print(f"모델 로딩 완료: prediction_length={prediction_length}")
    return bundle


def get_model_bundle(prediction_length: int, context_length: int = 24 * 85):
    key_prefix = f"pdt_{prediction_length}_ctx_{context_length}_"
    for k, v in _model_store.items():
        if k.startswith(key_prefix):
            return v

    return load_model_once(
        prediction_length=prediction_length,
        context_length=context_length,
        patch_size=16,
        num_samples=100,
        batch_size=64,
    )