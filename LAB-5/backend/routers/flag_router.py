from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from database import get_db
from models import AppUser, Flag, FlagSubmission
from auth import get_current_user

router = APIRouter(prefix="/api/flags", tags=["flags"])


class FlagSubmitRequest(BaseModel):
    flag_value: str


class FlagSubmitResponse(BaseModel):
    success: bool
    message: str
    points_awarded: int
    flag_id: Optional[str] = None
    flag_name: Optional[str] = None


class CapturedFlag(BaseModel):
    flag_id: str
    flag_name: str
    points_awarded: int
    submitted_at: str


class ProgressResponse(BaseModel):
    username: str
    total_points: int
    flags_captured: int
    captured_flags: List[CapturedFlag]


class ScoreboardEntry(BaseModel):
    rank: int
    username: str
    total_points: int
    flags_captured: int


@router.post("/submit", response_model=FlagSubmitResponse)
async def submit_flag(
    request: FlagSubmitRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find flag by value
    flag_result = await db.execute(
        select(Flag).where(Flag.flag_value == request.flag_value, Flag.is_active == True)
    )
    flag = flag_result.scalar_one_or_none()

    if not flag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid flag. Keep exploring!",
        )

    # Check if already submitted
    existing_result = await db.execute(
        select(FlagSubmission).where(
            FlagSubmission.user_id == current_user.id,
            FlagSubmission.flag_id == flag.id,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        return FlagSubmitResponse(
            success=False,
            message=f"You already captured this flag: {flag.name}",
            points_awarded=0,
            flag_id=flag.flag_id,
            flag_name=flag.name,
        )

    # Award points
    submission = FlagSubmission(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        flag_id=flag.id,
        submitted_at=datetime.utcnow(),
        points_awarded=flag.points,
    )
    db.add(submission)
    await db.commit()

    return FlagSubmitResponse(
        success=True,
        message=f"Flag captured! Well done — {flag.name}",
        points_awarded=flag.points,
        flag_id=flag.flag_id,
        flag_name=flag.name,
    )


@router.get("/my-progress", response_model=ProgressResponse)
async def my_progress(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FlagSubmission, Flag)
        .join(Flag, FlagSubmission.flag_id == Flag.id)
        .where(FlagSubmission.user_id == current_user.id)
        .order_by(FlagSubmission.submitted_at.desc())
    )
    rows = result.all()

    total_points = sum(sub.points_awarded for sub, _ in rows)
    captured = [
        CapturedFlag(
            flag_id=flag.flag_id,
            flag_name=flag.name,
            points_awarded=sub.points_awarded,
            submitted_at=sub.submitted_at.isoformat(),
        )
        for sub, flag in rows
    ]

    return ProgressResponse(
        username=current_user.username,
        total_points=total_points,
        flags_captured=len(captured),
        captured_flags=captured,
    )


@router.get("/scoreboard", response_model=List[ScoreboardEntry])
async def scoreboard(db: AsyncSession = Depends(get_db)):
    """Top 10 users by total points. Public endpoint."""
    result = await db.execute(
        select(
            AppUser.username,
            func.sum(FlagSubmission.points_awarded).label("total_points"),
            func.count(FlagSubmission.id).label("flags_captured"),
        )
        .join(FlagSubmission, AppUser.id == FlagSubmission.user_id)
        .group_by(AppUser.id, AppUser.username)
        .order_by(func.sum(FlagSubmission.points_awarded).desc())
        .limit(10)
    )
    rows = result.all()

    return [
        ScoreboardEntry(
            rank=idx + 1,
            username=row.username,
            total_points=row.total_points or 0,
            flags_captured=row.flags_captured,
        )
        for idx, row in enumerate(rows)
    ]
