from fastapi import APIRouter, HTTPException

from cache_service import read_cache_status, clear_redis_cache


router = APIRouter()


@router.get("/api/cache/status")
def get_cache_status():
    try:
        return read_cache_status()

    except Exception as e:
        return {
            "redis": "error",
            "message": str(e),
        }


@router.delete("/api/cache/clear")
def clear_cache():
    try:
        return clear_redis_cache()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Redis 캐시 초기화 실패: {e}",
        )