from supabase_client import supabase

BUCKET_NAME = "trustshare-files"


def upload_to_storage(local_file_path: str, storage_path: str) -> str:
    """
    Uploads a local encrypted file to Supabase Storage instantaneously.
    """
    with open(local_file_path, "rb") as f:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=f,
            file_options={"content-type": "application/octet-stream", "upsert": "true"}
        )
    return storage_path


def download_from_storage(storage_path: str) -> bytes:
    """
    Downloads an encrypted file from Supabase Storage.
    """
    res = supabase.storage.from_(BUCKET_NAME).download(storage_path)
    return res


def delete_from_storage(storage_path: str):
    """
    Deletes a file from Supabase Storage.
    """
    try:
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
    except Exception as e:
        print("Delete storage notice:", e)