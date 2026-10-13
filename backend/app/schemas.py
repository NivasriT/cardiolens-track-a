from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
	patient: Dict[str, Any] = Field(default_factory=dict)
	available_groups: List[str] = Field(default_factory=list)

VALID_GROUPS = {"ecg", "labs", "echo"}
