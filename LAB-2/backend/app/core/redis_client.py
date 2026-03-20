import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis = None
    
    async def connect(self):
        self.redis = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str):
        return await self.redis.get(key)
    
    async def set(self, key: str, value: str, ex: int = None):
        return await self.redis.set(key, value, ex=ex)
    
    async def delete(self, key: str):
        return await self.redis.delete(key)
    
    async def exists(self, key: str):
        return await self.redis.exists(key)

redis_client = RedisClient()
