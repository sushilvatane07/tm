from fastapi import FastAPI
from app.database import engine, Base
from app.routes import files

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrustShare API")

app.include_router(files.router)

@app.get("/")
def root():
    return {"message": "TrustShare API is running"}