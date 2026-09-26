from uuid import UUID
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: UUID
    checkin_id: UUID
    response: str


class AnalyzeResponse(BaseModel):
    checkin_id: UUID
    indicators: List[str] = Field(default_factory=list)
    change_detected: bool = False
    explanation: str
    requires_counsellor_review: bool = False
