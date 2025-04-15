from fastapi import APIRouter, Request, HTTPException
from fastapi.encoders import jsonable_encoder
from ..database import supabase  # Adjust import path as needed
#from ...schemas import GRCRequest, GRCResponse  # If using schemas
from typing import Optional
import httpx

router = APIRouter()

'''
@router.api_route("/validate-key", methods=["GET", "POST"])
async def validate_key(request: Request):
    """Endpoint to validate API keys (your existing implementation)"""
    api_key = request.query_params.get("api_key") or (await request.json()).get("api_key")
    print(f"Received key: '{api_key}'")
    api_key_clean = api_key.strip()
    
    res = supabase.table('api_keys') \
             .select('*') \
             .eq('key', api_key_clean) \
             .eq('is_active', True) \
             .execute()
    
    print(f"Query result: {res}")
    return {"valid": bool(res.data)}

@router.get("/validate-key-v2")
async def validate_key_v2(api_key: str):
    """Alternative key validation endpoint"""
    try:
        clean_key = api_key.strip()
        res = supabase.table('api_keys') \
                 .select('*') \
                 .eq('key', clean_key) \
                 .eq('is_active', True) \
                 .execute()
        return {"valid": bool(res.data)}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@router.get("/direct-db-query")
async def direct_query(api_key: str):
    """Direct database query example"""
    query = f"""
    SELECT 
        COUNT(*) FILTER (WHERE key = '{api_key.strip()}') as exact_matches,
        COUNT(*) FILTER (WHERE key LIKE '%{api_key.strip()}%') as similar_matches
    FROM api_keys
    """
    res = supabase.rpc('execute', {'query': query}).execute()
    return res.data

@router.get("/status")
async def service_status():
    """Health check endpoint"""
    return {"status": "OK", "version": "1.0.0"}
    '''