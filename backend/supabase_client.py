import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
# Prefer SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY to bypass RLS policies on server-side operations
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_KEY", "")
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)