from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import supabase
from .services.auth import verify_api_key
import logging

logging.basicConfig(level=logging.DEBUG) 

logger = logging.getLogger(__name__)



async def get_verified_user(verified_data: dict = Depends(verify_api_key)):
    """Dependency that returns user context"""

    logger.info(f"User context: {verified_data}")
    return {
        "user_id": verified_data['auth_info']['user_id'],
        "user_email": verified_data['auth_info']['email'],
        "api_key_id": verified_data['auth_info']['api_key_id'],
        "masked_key": verified_data['auth_info']['key'][:6] + "..."
    }


    