#from fastapi import Depends, HTTPException
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import supabase
#from .services.auth import verify_api_key
import logging

import os
import traceback
from datetime import datetime, timezone

logging.basicConfig(level=logging.DEBUG) 

logger = logging.getLogger(__name__)

"""
very_api_key inline
"""
#logger = logging.getLogger(__name__)
security = HTTPBearer()

logger.info(f"Security Key is: {security}")

async def verify_api_key(request: Request):
    """Verify API key from Authorization header"""

    logger.info("Executing verify_api_key dependency")
    
   # logger.info(f"Authorization credentials received: {credentials}")
    try:
        api_key = request.headers.get("x-api-key")

        if not api_key:
            logger.error("No API key provided in headers")
            raise HTTPException(
                status_code=401,
                detail="API key required (x-api-key header)"
            )


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

        try:
            update_response = supabase.table('api_keys') \
                .update({
                    'last_used': datetime.now(timezone.utc).isoformat()
                }) \
                .eq('id', record['id']) \
                .execute()
            
            if hasattr(update_response, 'error') and update_response.error:
                logger.error(f"Failed to update last_used: {update_response.error}")
                # Don't fail the request, just log the error
        except Exception as update_error:
            logger.error(f"Error updating last_used: {str(update_error)}\n{traceback.format_exc()}")


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

"""
very_api_key inline
"""

async def get_verified_user(verified_data: dict = Depends(verify_api_key)):
    """Dependency that returns user context"""

    logger.info(f"User context: {verified_data}")
    return {
        "user_id": verified_data['auth_info']['user_id'],
        "user_email": verified_data['auth_info']['email'],
        "api_key_id": verified_data['auth_info']['api_key_id'],
        "masked_key": verified_data['auth_info']['key'][:6] + "..."
    }


    