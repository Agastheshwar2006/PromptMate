from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import PromptTemplate
from app.schemas import TemplateResponse, TemplateCreateRequest

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.get("", response_model=List[TemplateResponse])
def list_templates(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PromptTemplate)
    if category:
        query = query.filter(PromptTemplate.category == category)
    templates = query.all()
    return templates

@router.get("/{id}", response_model=TemplateResponse)
def get_template(id: int, db: Session = Depends(get_db)):
    template = db.query(PromptTemplate).filter(PromptTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("", response_model=TemplateResponse)
def create_template(request: TemplateCreateRequest, db: Session = Depends(get_db)):
    template = PromptTemplate(**request.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template
