from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import models
from app.schemas import credentials as schemas
import uuid
from datetime import datetime

router = APIRouter(prefix="/credentials", tags=["Credentials"])
apps_router = APIRouter(prefix="/applications", tags=["Applications"])

# --- Applications ---
@apps_router.get("/", response_model=List[schemas.Application])
def get_applications(db: Session = Depends(get_db)):
    return db.query(models.Application).all()

@apps_router.post("/", response_model=schemas.Application)
def create_application(app: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    db_app = models.Application(**app.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

# --- Credentials ---
@router.get("/", response_model=List[schemas.Credential])
def get_credentials(project_id: Optional[uuid.UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.Credential)
    if project_id:
        query = query.filter(models.Credential.project_id == project_id)
    return query.all()

@router.post("/", response_model=schemas.Credential)
def create_credential(cred: schemas.CredentialCreate, db: Session = Depends(get_db)):
    db_cred = models.Credential(**cred.model_dump())
    db.add(db_cred)
    db.commit()
    db.refresh(db_cred)
    return db_cred

@router.patch("/{cred_id}", response_model=schemas.Credential)
def update_credential(cred_id: uuid.UUID, update: schemas.CredentialUpdate, db: Session = Depends(get_db)):
    db_cred = db.query(models.Credential).filter(models.Credential.id == cred_id).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cred, key, value)
    
    db.commit()
    db.refresh(db_cred)
    return db_cred

@router.delete("/{cred_id}")
def delete_credential(cred_id: uuid.UUID, db: Session = Depends(get_db)):
    db_cred = db.query(models.Credential).filter(models.Credential.id == cred_id).first()
    if not db_cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    db.delete(db_cred)
    db.commit()
    return {"status": "success"}
