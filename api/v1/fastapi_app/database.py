#from async_supabase import create_client #full async

from supabase import create_client , Client

from supabase.lib.client_options import ClientOptions  # Add this import


import os
from datetime import datetime
import time

from dotenv import load_dotenv

load_dotenv()  # Looks for .env in current directory

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY"),
    options=ClientOptions(postgrest_client_timeout=10, storage_client_timeout=10)
)

'''
class SupabaseClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_KEY")
            if not url or not key:
                raise ValueError("Missing Supabase credentials in environment variables")
            cls._instance.client = create_client(url, key, options=ClientOptions(postgrest_client_timeout=10, storage_client_timeout=10)
)
        return cls._instance

    @property
    def table(self):
        return self.client.table

# Singleton instance
supabase = SupabaseClient()
'''