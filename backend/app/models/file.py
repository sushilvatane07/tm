from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    owner_id = Column(Integer, nullable=False)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=False)
    folder = Column(String, nullable=True, default="root")
    storage_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())