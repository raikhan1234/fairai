from pydantic import BaseModel, Field
from typing import List, Optional


class AnalyzeMLRequest(BaseModel):
    dataset_id: str
    target_column: str
    protected_attribute: str
    models: List[str] = Field(default=["logistic_regression", "random_forest"])
    test_size: float = 0.2
    random_state: int = 42


class AnalyzePredictionsRequest(BaseModel):
    dataset_id: str
    target_column: str
    prediction_column: str
    protected_attribute: str


class AnalyzeLLMRequest(BaseModel):
    dataset_id: str
    target_column: str
    prediction_columns: List[str]
    protected_attribute: str
