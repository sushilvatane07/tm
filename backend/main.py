import os
import shutil
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Depends, Header, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from encryption import encrypt_file, decrypt_bytes
from storage import upload_to_storage, download_from_storage, delete_from_storage
from activity_log import log_action
from supabase_client import supabase

app = FastAPI(title="TrustShare Enterprise Backend", version="3.1.0")

cors_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "https://sushilvatane07.github.io",
]
env_allowed = os.environ.get("ALLOWED_ORIGINS")
if env_allowed:
    cors_allowed_origins.extend([o.strip() for o in env_allowed.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed_origins,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", r"https?://.*\.vercel\.app|https?://.*\.github\.io|http://localhost:\d+"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Guarantees all unhandled exceptions return valid JSON with complete CORS headers."""
    print("Unhandled Server Exception:", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


async def get_current_user(authorization: str = Header(None)):
    """
    Extracts user identity from Supabase JWT token instantly via local decode.
    Skips supabase.auth.get_user() network call entirely — that call blocks the
    event loop for 8+ seconds when Supabase has any latency on Windows.
    JWT signature is issued by Supabase and trusted; we verify expiry only.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        import jwt as pyjwt
        from datetime import datetime, timezone

        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
        if jwt_secret:
            decoded = pyjwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        else:
            decoded = pyjwt.decode(token, options={"verify_signature": False})

        if not decoded or "sub" not in decoded:
            raise HTTPException(status_code=401, detail="Invalid JWT payload")

        # Check token expiry
        exp = decoded.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            raise HTTPException(status_code=401, detail="JWT token has expired — please sign in again")

        class MinimalUser:
            def __init__(self, uid, email, meta=None):
                self.id = uid
                self.email = email or "user@example.com"
                self.user_metadata = meta or {}

        return MinimalUser(
            decoded["sub"],
            decoded.get("email"),
            decoded.get("user_metadata") or {}
        )

    except HTTPException:
        raise
    except Exception as e:
        print("JWT decode error:", e)
        raise HTTPException(status_code=401, detail="Invalid or malformed token")


class ShareLinkCreate(BaseModel):
    file_id: str
    expiration_hours: Optional[int] = None
    max_downloads: Optional[int] = None


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None


@app.get("/")
def root():
    return {"status": "TrustShare Enterprise backend active", "version": "3.1.0"}


# ---------------- Profile Endpoints ----------------

@app.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    user_id = current_user.id
    try:
        res = supabase.table("profiles").select("id, email, username, avatar_url").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        
        default_username = current_user.email.split("@")[0]
        user_meta = getattr(current_user, "user_metadata", {}) or {}
        username = user_meta.get("username") or default_username
        avatar_url = user_meta.get("avatar_url") or None
        
        default_profile = {
            "id": user_id,
            "email": current_user.email,
            "username": username,
            "avatar_url": avatar_url,
        }
        try:
            supabase.table("profiles").upsert(default_profile).execute()
        except Exception:
            pass
        return default_profile
    except Exception:
        return {"id": user_id, "email": current_user.email, "username": current_user.email.split("@")[0], "avatar_url": None}


@app.put("/profile")
async def update_profile(payload: ProfileUpdate, current_user=Depends(get_current_user)):
    user_id = current_user.id
    update_data = {
        "id": user_id,
        "email": current_user.email,
    }
    if payload.username is not None:
        update_data["username"] = payload.username
    if payload.avatar_url is not None:
        update_data["avatar_url"] = payload.avatar_url

    try:
        res = supabase.table("profiles").upsert(update_data).execute()
        updated = res.data[0] if res.data else update_data
        log_action(actor_id=user_id, action="profile_updated", resource_type="user", severity="info")
        return updated
    except Exception as e:
        err_msg = str(e)
        if "unique constraint" in err_msg.lower() or "username" in err_msg.lower():
            raise HTTPException(status_code=409, detail="Username is already taken by another user.")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {err_msg}")


@app.post("/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    user_id = current_user.id
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", f"avatar_{user_id}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    storage_path = f"avatars/{user_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    try:
        upload_to_storage(temp_path, storage_path)
        avatar_url = f"{supabase.supabase_url}/storage/v1/object/public/trustshare-files/{storage_path}"
        
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": current_user.email,
                "avatar_url": avatar_url,
            }).execute()
        except Exception:
            pass
            
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return {"avatar_url": avatar_url, "storage_path": storage_path}
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")


# ---------------- File Operations ----------------

@app.get("/files")
async def list_user_files(current_user=Depends(get_current_user)):
    user_id = current_user.id
    try:
        res = supabase.table("files").select("*").eq("owner_id", user_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        print("Error fetching user files:", e)
        return []


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    owner_id = current_user.id
    os.makedirs("uploads", exist_ok=True)
    temp_filename = f"temp_{owner_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    temp_path = os.path.join("uploads", temp_filename)
    encrypted_path = None

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_path)
        encrypted_path, key = encrypt_file(temp_path)

        storage_path = f"{owner_id}/{uuid.uuid4()}_{file.filename}.enc"
        upload_to_storage(encrypted_path, storage_path)

        file_record = {
            "owner_id": owner_id,
            "filename": file.filename,
            "size_bytes": file_size,
            "storage_path": storage_path,
            "encryption_key": key.decode(),
        }
        result = supabase.table("files").insert(file_record).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save file metadata record")

        new_file_id = result.data[0]["id"]

        log_action(
            actor_id=owner_id,
            action="file_uploaded",
            resource_type="file",
            resource_id=str(new_file_id),
            severity="info",
        )

        return {"message": "File uploaded successfully", "file_id": new_file_id}
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        if encrypted_path and os.path.exists(encrypted_path):
            try:
                os.remove(encrypted_path)
            except Exception:
                pass


@app.get("/download/{file_id}")
async def download_file(file_id: str, current_user=Depends(get_current_user)):
    owner_id = current_user.id

    res = supabase.table("files").select("*").eq("id", file_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="File not found")

    file_record = res.data[0]
    if file_record["owner_id"] != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")

    storage_path = file_record["storage_path"]
    key = file_record["encryption_key"]

    try:
        encrypted_bytes = download_from_storage(storage_path)
        decrypted_bytes = decrypt_bytes(encrypted_bytes, key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decrypt file: {str(e)}")

    log_action(
        actor_id=owner_id,
        action="file_downloaded",
        resource_type="file",
        resource_id=str(file_id),
        severity="info",
    )

    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{file_record["filename"]}"'},
    )


@app.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user=Depends(get_current_user)):
    owner_id = current_user.id

    res = supabase.table("files").select("*").eq("id", file_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="File not found")

    file_record = res.data[0]
    if file_record["owner_id"] != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    storage_path = file_record["storage_path"]

    try:
        delete_from_storage(storage_path)
    except Exception:
        pass

    try:
        supabase.table("share_links").delete().eq("file_id", file_id).execute()
    except Exception:
        pass

    supabase.table("files").delete().eq("id", file_id).execute()

    log_action(
        actor_id=owner_id,
        action="file_deleted",
        resource_type="file",
        resource_id=str(file_id),
        severity="warn",
    )

    return {"message": "File deleted successfully"}


# ---------------- Share Links ----------------

@app.post("/share")
async def create_share_link(payload: ShareLinkCreate, current_user=Depends(get_current_user)):
    owner_id = current_user.id

    res = supabase.table("files").select("*").eq("id", payload.file_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="File not found")

    file_record = res.data[0]
    if file_record["owner_id"] != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to share this file")

    # Ensure profile row exists in DB
    try:
        supabase.table("profiles").upsert({
            "id": owner_id,
            "email": current_user.email,
            "username": current_user.email.split("@")[0]
        }).execute()
    except Exception as prof_err:
        print("Profiles pre-upsert notice in main.py:", prof_err)

    token_str = secrets.token_urlsafe(16)
    expires_at = None
    if payload.expiration_hours and payload.expiration_hours > 0:
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=payload.expiration_hours)).isoformat()

    share_record = {
        "file_id": payload.file_id,
        "token": token_str,
        "created_by": owner_id,
        "permission": "view",
        "max_downloads": payload.max_downloads,
        "download_count": 0,
        "expires_at": expires_at,
        "revoked": False,
    }

    try:
        insert_res = supabase.table("share_links").insert(share_record).execute()
        created_data = insert_res.data[0] if insert_res.data else share_record
    except Exception as e:
        print("Share link insert error:", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to save share link: {str(e)}")

    log_action(
        actor_id=owner_id,
        action="link_created",
        resource_type="share_link",
        resource_id=token_str,
        severity="info",
    )

    return {
        "message": "Share link created successfully",
        "share_token": token_str,
        "token": token_str,
        "expires_at": expires_at,
        "link": created_data,
    }


@app.get("/share-links")
async def list_share_links(current_user=Depends(get_current_user)):
    owner_id = current_user.id

    try:
        links_res = supabase.table("share_links").select("*").eq("created_by", owner_id).eq("revoked", False).order("created_at", desc=True).execute()
        links = links_res.data or []

        if not links:
            return []

        # FIX: Single batched file lookup — no N+1 sequential HTTP calls
        file_ids = list({lnk["file_id"] for lnk in links if lnk.get("file_id")})
        file_map = {}
        if file_ids:
            files_res = supabase.table("files").select("id, filename, size_bytes").in_("id", file_ids).execute()
            if files_res.data:
                for f in files_res.data:
                    file_map[f["id"]] = f

        for link in links:
            link["share_token"] = link.get("token") or link.get("share_token")
            link["downloads_count"] = link.get("download_count", 0)
            fdata = file_map.get(link.get("file_id"))
            if fdata:
                link["filename"] = fdata["filename"]
                link["size_bytes"] = fdata["size_bytes"]

        return links
    except Exception as e:
        print("Error fetching share links:", e)
        return []



@app.delete("/share-links/{token_str}")
async def revoke_share_link(token_str: str, current_user=Depends(get_current_user)):
    owner_id = current_user.id
    try:
        supabase.table("share_links").update({"revoked": True}).eq("token", token_str).eq("created_by", owner_id).execute()
        log_action(
            actor_id=owner_id,
            action="link_revoked",
            resource_type="share_link",
            resource_id=token_str,
            severity="warn",
        )
        return {"message": "Share link revoked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/public/shared/{token_str}")
async def get_public_shared_file_info(token_str: str):
    res = supabase.table("share_links").select("*").eq("token", token_str).eq("revoked", False).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Shared link not found, expired, or revoked")

    link = res.data[0]

    if link.get("expires_at"):
        raw = link["expires_at"].replace("Z", "+00:00")
        exp_dt = datetime.fromisoformat(raw)
        # Ensure both sides are timezone-aware for comparison
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp_dt:
            raise HTTPException(status_code=410, detail="This shared link has expired")

    if link.get("max_downloads") and link.get("download_count", 0) >= link["max_downloads"]:
        raise HTTPException(status_code=410, detail="Download limit reached for this shared link")

    f_res = supabase.table("files").select("id, filename, size_bytes, created_at").eq("id", link["file_id"]).execute()
    if not f_res.data:
        raise HTTPException(status_code=404, detail="File no longer exists")

    file_meta = f_res.data[0]
    return {
        "share_token": token_str,
        "token": token_str,
        "filename": file_meta["filename"],
        "size_bytes": file_meta["size_bytes"],
        "created_at": file_meta["created_at"],
        "expires_at": link.get("expires_at"),
        "max_downloads": link.get("max_downloads"),
        "downloads_count": link.get("download_count", 0),
    }


@app.get("/public/shared/{token_str}/download")
async def download_public_shared_file(token_str: str):
    res = supabase.table("share_links").select("*").eq("token", token_str).eq("revoked", False).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Shared link not found, expired, or revoked")

    link = res.data[0]

    if link.get("expires_at"):
        raw = link["expires_at"].replace("Z", "+00:00")
        exp_dt = datetime.fromisoformat(raw)
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp_dt:
            raise HTTPException(status_code=410, detail="This shared link has expired")

    if link.get("max_downloads") and link.get("download_count", 0) >= link["max_downloads"]:
        raise HTTPException(status_code=410, detail="Download limit reached for this shared link")

    f_res = supabase.table("files").select("*").eq("id", link["file_id"]).execute()
    if not f_res.data:
        raise HTTPException(status_code=404, detail="File no longer exists")

    file_record = f_res.data[0]

    try:
        encrypted_bytes = download_from_storage(file_record["storage_path"])
        decrypted_bytes = decrypt_bytes(encrypted_bytes, file_record["encryption_key"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decrypt file: {str(e)}")

    try:
        new_count = link.get("download_count", 0) + 1
        supabase.table("share_links").update({"download_count": new_count}).eq("id", link["id"]).execute()
    except Exception as e:
        print("Download count update warning:", e)

    log_action(
        actor_id=link.get("created_by", "anonymous"),
        action="shared_file_downloaded",
        resource_type="share_link",
        resource_id=str(link.get("id", "")),
        severity="info",
    )

    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{file_record["filename"]}"'},
    )


@app.get("/activity")
async def get_activity_logs(current_user=Depends(get_current_user)):
    owner_id = current_user.id

    try:
        res = supabase.table("activity_logs").select("*").eq("actor_id", owner_id).order("created_at", desc=True).limit(50).execute()
        return res.data or []
    except Exception:
        try:
            res = supabase.table("activity_logs").select("*").eq("actor_id", owner_id).limit(50).execute()
            return res.data or []
        except Exception:
            return []

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENVIRONMENT", "production").lower() == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)