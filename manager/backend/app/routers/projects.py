from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import models
from app.schemas import projects as schemas
import uuid

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(
        code=project.code,
        name=project.name,
        description=project.description
    )
    db.add(db_project)
    try:
        db.commit()
        db.refresh(db_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_project

@router.get("/{project_id}/variables")
def get_project_variables(project_id: uuid.UUID, db: Session = Depends(get_db)):
    # 1. Get all relevant definitions: Global (project_id is null) OR Project-specific
    definitions = db.query(models.VariableDefinition).filter(
        (models.VariableDefinition.project_id == None) | 
        (models.VariableDefinition.project_id == project_id)
    ).all()
    
    # 2. Get existing values for this project
    values = db.query(models.ProjectVariableValue).filter(models.ProjectVariableValue.project_id == project_id).all()
    values_map = {v.variable_definition_id: v.value for v in values}
    
    # 3. Build a combined list
    result = []
    for d in definitions:
        result.append({
            "definition": d,
            "value": values_map.get(d.id, d.default_value)
        })
    return result

@router.post("/{project_id}/variables")
def update_project_variable(project_id: uuid.UUID, update: schemas.VariableValueUpdate, db: Session = Depends(get_db)):
    # Find or create the value
    db_value = db.query(models.ProjectVariableValue).filter(
        models.ProjectVariableValue.project_id == project_id,
        models.ProjectVariableValue.variable_definition_id == update.variable_definition_id
    ).first()
    
    if db_value:
        db_value.value = update.value
    else:
        db_value = models.ProjectVariableValue(
            project_id=project_id,
            variable_definition_id=update.variable_definition_id,
            value=update.value
        )
        db.add(db_value)
    
    db.commit()
    return {"status": "success"}

# Router for global definitions
definitions_router = APIRouter(prefix="/variable-definitions", tags=["Variable Definitions"])

@definitions_router.get("/", response_model=List[schemas.VariableDefinition])
def get_definitions(db: Session = Depends(get_db)):
    # Return only global definitions for the global manager
    return db.query(models.VariableDefinition).filter(models.VariableDefinition.project_id == None).all()

@definitions_router.post("/", response_model=schemas.VariableDefinition)
def create_definition(definition: schemas.VariableDefinitionBase, db: Session = Depends(get_db)):
    db_def = models.VariableDefinition(**definition.model_dump())
    db.add(db_def)
    db.commit()
    db.refresh(db_def)
    return db_def

@definitions_router.delete("/{definition_id}")
def delete_definition(definition_id: uuid.UUID, db: Session = Depends(get_db)):
    db_def = db.query(models.VariableDefinition).filter(models.VariableDefinition.id == definition_id).first()
    if not db_def:
        raise HTTPException(status_code=404, detail="Definition not found")
    
    db.delete(db_def)
    db.commit()
    return {"status": "success"}
