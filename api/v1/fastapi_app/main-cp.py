from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv() #check .env in current local directory

app = FastAPI()

# Configure CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "https://your-nextjs-app.vercel.app")],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(
    core.router,
    prefix="/api/v1",
    tags=["Core"]
)

app.include_router(
    grc.router,
    prefix="/api/v1",
    tags=["GRC"]
)



# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@app.get("/api/python")
async def root():
    return {"message": "Hello from FastAPI on Vercel"}

@app.api_route("/api/validate-key", methods=["GET", "POST"])
async def validate_key(request: Request):
    api_key = request.query_params.get("api_key") or (await request.json()).get("api_key")
    print(f"Received key: '{api_key}'")  # Check what's actually received
    api_key_clean=api_key.strip()
    res = supabase.table('api_keys') \
             .select('*') \
             .eq('key',api_key_clean) \
             .eq('is_active',True) \
             .execute()
    print(f"Query result: {res}")  # Inspect raw response
    return {"valid": bool(res.data)}

@app.get("/api/validate-key-v2")
async def validate_key(api_key: str):
    try:
        clean_key = api_key.strip()
        
        # Debug Level 1: Exact match check
        exact_debug = supabase.rpc('exact_key_match_debug', {
            'key_input': clean_key
        }).execute()
        
        # Debug Level 2: Force find any matches
        force_debug = supabase.rpc('force_find_key', {
            'key_input': clean_key
        }).execute()
        
        # Final validation logic
        is_valid = exact_debug.data[0]['exists'] if exact_debug.data else False
        
        return {
            "valid": is_valid,
            "debug": {
                "exact_match_debug": exact_debug.data[0] if exact_debug.data else None,
                "force_find_debug": force_debug.data[0] if force_debug.data else None,
                "diagnostics": {
                    "input_key": clean_key,
                    "input_length": len(clean_key),
                    "is_unicode": any(ord(c) > 127 for c in clean_key),
                    "hex_representation": clean_key.encode('utf-8').hex()
                }
            }
        }
        
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "debug": {
                "exception_type": type(e).__name__,
                "supabase_error": getattr(e, 'message', None)
            }
        }


@app.get("/api/direct-db-query")
async def direct_query(api_key: str):
    query = f"""
    SELECT 
        COUNT(*) FILTER (WHERE key = '{api_key.strip()}') as exact_matches,
        COUNT(*) FILTER (WHERE key LIKE '%{api_key.strip()}%') as similar_matches,
        EXISTS (SELECT 1 FROM api_keys WHERE key = '{api_key.strip()}') as key_exists
    FROM api_keys
    """
    res = supabase.rpc('execute', {'query': query}).execute()
    return res.data

@app.get("/api/validate-key-final")
async def validate_key(api_key: str):
    try:
        # Clean the key aggressively
        api_key_clean = "".join(api_key.strip().split())
        
        # Try multiple query methods
        res = supabase.table('api_keys') \
                 .select('*') \
                 .ilike('key', api_key_clean) \
                 .eq('is_active', True) \
                 .limit(1) \
                 .maybe_single() \
                 .execute()
        
        # If still empty, try counting
        if not res.data:
            count = supabase.table('api_keys') \
                      .select('count', count='exact') \
                      .ilike('key', api_key_clean) \
                      .execute()
            return {
                "valid": False,
                "debug": {
                    "reason": "Key not found or inactive",
                    "similar_keys_count": count.count
                }
            }
        
        return {"valid": True, "key_info": res.data}
        
    except Exception as e:
        return {"valid": False, "error": str(e)}

# Add other endpoints as needed