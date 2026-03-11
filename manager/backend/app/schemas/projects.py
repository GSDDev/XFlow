from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List, Any
from datetime import datetime

# --- Variables ---
class VariableDefinitionBase(BaseModel):
    project_id: Optional[UUID] = None
    key: str
    label: str
    data_type: str # string, number, boolean, password, json
    default_value: Optional[str] = None

class VariableDefinition(VariableDefinitionBase):
    id: UUID
    class Config:
        from_attributes = True

# --- Projects ---
class ProjectBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

# --- Variable Values ---
class VariableValueUpdate(BaseModel):
    variable_definition_id: UUID
    value: str

class ProjectVariableValue(BaseModel):
    project_id: UUID
    variable_definition_id: UUID
    value: str
    variable_info: Optional[VariableDefinition] = None
    class Config:
        from_attributes = True
