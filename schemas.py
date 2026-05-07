from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class PredictRequest(BaseModel):
    building: str
    datetime: str
    horizon: int = 48
    context_hours: int = 24 * 85


class PredictResponse(BaseModel):
    building: str
    datetime: str
    context_hours: int
    horizon: int
    history: List[dict]
    forecast: List[dict]


class PredictCacheRequest(BaseModel):
    building: str
    datetime: str
    context_hours: int = 24 * 85
    view_type: str  # short | medium


class PredictCacheResponse(BaseModel):
    building: str
    datetime: str
    context_hours: int
    short_status: str
    medium_status: str
    short: Optional[Dict[str, Any]] = None
    medium: Optional[Dict[str, Any]] = None


class WeatherResponse(BaseModel):
    datetime: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None


class AcademicInformationResponse(BaseModel):
    datetime: str
    academicEvent: Optional[str] = None
    semesterStatus: Optional[str] = None
    covid: Optional[str] = None