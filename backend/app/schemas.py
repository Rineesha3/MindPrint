from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class QuizAnswerIn(BaseModel):
    dimension: str
    pole: Optional[str] = None  # None for the middle "it depends" option


class PredictRequest(BaseModel):
    text: str = Field(..., description="Free-form writing sample from the user")
    mode: Optional[Literal["quiz", "deepQuiz", "freeform"]] = None
    # Quiz modes: the picked answers, scored directly (see quiz_scoring.py)
    answers: Optional[List[QuizAnswerIn]] = Field(None, max_length=100)


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="The person's own writing")
    # Quizzes: how many questions to plan, and how many each dimension has.
    count: int = Field(0, ge=0, le=60)
    max_per_dimension: Dict[str, int] = {}


class AxisLean(BaseModel):
    letter: str
    certainty: float  # 0 = coin flip, 1 = fully sure


class AnalyzeResponse(BaseModel):
    axes: Dict[str, AxisLean]
    allocation: Dict[str, int]  # questions per dimension (quizzes)
    follow_ups: Dict[str, int]  # follow-up questions per dimension (free writing)


class AxisResult(BaseModel):
    predicted: str
    probabilities: Dict[str, float]
    confidence: str = "medium"  # "low" | "medium" | "high", relative to the axis's tuned threshold
    axis_reliability: float = 0.0  # this axis's held-out test accuracy


class WritingSignal(BaseModel):
    feature: str
    direction: str  # "above" or "below" average
    blurb: str


class PredictResponse(BaseModel):
    predicted_type: str
    axes: Dict[str, AxisResult]
    word_count: int
    warning: Optional[str] = None
    signals: List[WritingSignal] = []


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=200)
    name: str = Field("", max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    has_password: bool = True


class UpdateNameRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str = Field(..., min_length=8, max_length=200)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=200)


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class HistoryEntryIn(BaseModel):
    predicted_type: str
    axes: Dict[str, AxisResult]
    word_count: int
    warning: Optional[str] = None
    signals: List[WritingSignal] = []


class HistoryEntryOut(HistoryEntryIn):
    taken_at: float
    test_mode: Optional[str] = None
