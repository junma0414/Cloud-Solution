from ..database import supabase
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..database import supabase
import logging
import os
import traceback

logger = logging.getLogger(__name__)
security = HTTPBearer()

logger.info(f"Security Key is: {security}")

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key from Authorization header"""

    logger.info("Executing verify_api_key dependency")

    logger.info(f"Authorization credentials received: {credentials}")
    try:
        api_key = credentials.credentials
        logger.info(f"Attempting to verify API key: {api_key[:6]}...")

        logger.debug(f"Supabase URL: {os.getenv('SUPABASE_URL')}")
        logger.debug(f"Supabase Key: {os.getenv('SUPABASE_SERVICE_KEY')}")

        # Execute query
        # First, get the api_keys data
        response = supabase.table('api_keys') \
        .select('id, key, is_active, user_id, user_view(email)') \
        .eq('key', api_key) \
        .eq('is_active', True) \
        .execute()
            
        logger.info(f"supabase return: {response}...")


        # Properly handle response
        if not hasattr(response, 'data') or not response.data:
            logger.warning(f"No active key found: {api_key[:6]}...")
            raise HTTPException(status_code=403, detail="Invalid or inactive API key")

        # Get first record if list, or use direct data
        record = response.data[0] if isinstance(response.data, list) else response.data

        #user_email = record.data.get('user_view', {}).get('email')

        if not record:
            raise HTTPException(status_code=403, detail="Invalid API key")

        return {
            "auth_info": {
                "api_key_id": record['id'],
                "user_id":record['user_id'],
                "email":record.get('user_view', {}).get('email'),
                "key": record['key'],
                "is_active": record['is_active']
            },
            "user_info": record.get('users', {})
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth failed: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Authentication service error")




