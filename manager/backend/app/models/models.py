from sqlalchemy import Column, String, Text, ForeignKey, Enum, BigInteger, DateTime, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VariableDefinition(Base):
    __tablename__ = "variable_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    key = Column(String(50), unique=True, nullable=False)
    label = Column(String(100), nullable=False)
    data_type = Column(String(20), nullable=False) # string, number, boolean, password, json
    default_value = Column(Text)

class ProjectVariableValue(Base):
    __tablename__ = "project_variable_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    variable_definition_id = Column(UUID(as_uuid=True), ForeignKey("variable_definitions.id", ondelete="CASCADE"), nullable=False)
    value = Column(Text)

    __table_args__ = (UniqueConstraint('project_id', 'variable_definition_id', name='_project_variable_uc'),)

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    type = Column(String(20)) # ERP, Web, Desktop

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    alias = Column(String(50), nullable=False)
    username = Column(String(100))
    password_encrypted = Column(Text)
    last_rotation = Column(DateTime(timezone=True))

class VDIInventory(Base):
    __tablename__ = "vdi_inventory"

    hostname = Column(String(50), primary_key=True)
    mac_address = Column(String(17), unique=True)
    os_version = Column(String(50))
    assigned_project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    current_status = Column(String(20), default="Offline") # Idle, Busy, Offline, Maintenance
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(50)) # Placeholder for user identification
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True))
    old_value = Column(JSONB)
    new_value = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
