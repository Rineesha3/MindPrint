from typing import List

from fastapi import APIRouter, Depends

from .auth import get_current_user
from .history_store import clear_entries, get_entries
from .schemas import HistoryEntryOut

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[HistoryEntryOut])
def list_history(user: dict = Depends(get_current_user)):
    return get_entries(user["id"])


@router.delete("")
def delete_history(user: dict = Depends(get_current_user)):
    clear_entries(user["id"])
    return {"status": "ok"}
