from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime

# --- Applications ---
class ApplicationBase(BaseModel):
    name: str
    type: Optional[str] = None # ERP, Web, Desktop

class ApplicationCreate(ApplicationBase):
    pass

class Application(ApplicationBase):
    id: UUID
    class Config:
        from_attributes = True

# --- Credentials ---
class CredentialBase(BaseModel):
    application_id: UUID
    project_id: Optional[UUID] = None
    alias: str
    username: Optional[str] = None
    password_encrypted: Optional[str] = None

class CredentialCreate(CredentialBase):
    pass

class CredentialUpdate(BaseModel):
    alias: Optional[str] = None
    username: Optional[str] = None
    password_encrypted: Optional[str] = None
    last_rotation: Optional[datetime] = None

class Credential(CredentialBase):
    id: UUID
    last_rotation: Optional[datetime] = None
    application: Optional[Application] = None
    class Config:
        from_attributes = True
