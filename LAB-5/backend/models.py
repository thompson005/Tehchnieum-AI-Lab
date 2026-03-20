import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, JSON, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class AppUser(Base):
    __tablename__ = "app_users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="citizen")  # citizen / clerk / supervisor / system_admin
    citizen_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("McpAuditLog", back_populates="user", cascade="all, delete-orphan")
    flag_submissions = relationship("FlagSubmission", back_populates="user", cascade="all, delete-orphan")


class McpAuditLog(Base):
    __tablename__ = "mcp_audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, nullable=True, index=True)
    user_id = Column(String, ForeignKey("app_users.id"), nullable=True, index=True)
    mcp_server = Column(String(100), nullable=False)
    tool_name = Column(String(200), nullable=False)
    tool_args = Column(JSON, nullable=True)
    tool_result = Column(JSON, nullable=True)
    called_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("AppUser", back_populates="audit_logs")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("app_users.id"), nullable=False, index=True)
    messages = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("AppUser", back_populates="sessions")


class Flag(Base):
    __tablename__ = "flags"

    id = Column(String, primary_key=True, default=generate_uuid)
    flag_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g. LAB5-01
    flag_value = Column(String(255), nullable=False)
    points = Column(Integer, nullable=False, default=0)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    submissions = relationship("FlagSubmission", back_populates="flag", cascade="all, delete-orphan")


class FlagSubmission(Base):
    __tablename__ = "flag_submissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("app_users.id"), nullable=False, index=True)
    flag_id = Column(String, ForeignKey("flags.id"), nullable=False, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    points_awarded = Column(Integer, nullable=False, default=0)

    user = relationship("AppUser", back_populates="flag_submissions")
    flag = relationship("Flag", back_populates="submissions")
