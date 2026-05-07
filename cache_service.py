import json
import redis


REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

# 캐시 유지 시간: 2시간
CACHE_TTL_SECONDS = 60 * 60 * 2

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True,
)


def make_cache_key(building: str, dt_str: str, context_hours: int) -> str:
    return f"{building}|{dt_str}|ctx={context_hours}"


def get_cache_entry(cache_key: str):
    """
    Redis에서 캐시 조회
    """
    try:
        cached = redis_client.get(cache_key)

        if cached is None:
            return None

        return json.loads(cached)

    except Exception as e:
        print(f"[REDIS GET ERROR] {cache_key}: {e}")
        return None


def set_cache_entry(cache_key: str, cache_entry: dict):
    """
    Redis에 캐시 저장
    """
    try:
        redis_client.set(
            cache_key,
            json.dumps(cache_entry, ensure_ascii=False),
            ex=CACHE_TTL_SECONDS,
        )
    except Exception as e:
        print(f"[REDIS SET ERROR] {cache_key}: {e}")
        raise


def delete_cache_entry(cache_key: str):
    """
    Redis 캐시 삭제
    """
    try:
        redis_client.delete(cache_key)
    except Exception as e:
        print(f"[REDIS DELETE ERROR] {cache_key}: {e}")


def read_cache_status():
    """
    Redis 연결 상태와 캐시 키 목록 조회
    """
    redis_client.ping()
    keys = redis_client.keys("*")

    return {
        "redis": "connected",
        "key_count": len(keys),
        "keys": keys[:20],
        "ttl_seconds": CACHE_TTL_SECONDS,
    }


def clear_redis_cache():
    """
    Redis 캐시 전체 초기화
    """
    redis_client.flushdb()

    return {
        "message": "Redis 캐시를 초기화했습니다."
    }