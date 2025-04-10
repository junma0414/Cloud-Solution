from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GRCScore(BaseModel):
    cat: str
    score: float
    reason: Optional[str] = None

class GRCRequest(BaseModel):
    text: str

class GRCResponse(BaseModel):
    success: bool
    result: List[GRCScore]
    error: Optional[str] = None
    request_id: Optional[str] = None  # For tracking

class RequestLog(BaseModel):
    api_key: str
    request_data: dict
    created_at: datetime

class ResponseLog(BaseModel):
    request_id: str
    response_data: dict
    created_at: datetime

    