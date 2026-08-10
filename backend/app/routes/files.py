import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.file import FileRecord

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_file(file: UploadFile = File(...), owner_id: int = 1, db: Session = Depends(get_db)):
    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    record = FileRecord(
        filename=file.filename,
        owner_id=owner_id,
        content_type=file.content_type,
        size_bytes=os.path.getsize(save_path),
        storage_path=save_path,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "filename": record.filename, "size": record.size_bytes}


@router.get("/")
def list_files(owner_id: int = 1, db: Session = Depends(get_db)):
    return db.query(FileRecord).filter(FileRecord.owner_id == owner_id).all()


@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db)):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(record.storage_path):
        raise HTTPException(status_code=404, detail="File missing from storage")
    return FileResponse(
        path=record.storage_path,
        filename=record.filename,
        media_type=record.content_type or "application/octet-stream",
    )