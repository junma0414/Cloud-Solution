# api/v1/fastapi_app/grc.py
import re
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from openai import OpenAI, AsyncOpenAI
from typing import List, Dict
from uuid import uuid4
from datetime import datetime  # This imports the datetime class

#from ..schemas import GRCRequest, GRCResponse, GRCScore
from ..dependencies import verify_api_key, get_verified_user
from ..database import supabase

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GRCScore(BaseModel):
    cat: str
    score: float
    reason: Optional[str] = None

class GRCRequest(BaseModel):
    text: str

class GRCResponse(BaseModel):
    success: bool
    result: List[GRCScore]
    error: Optional[str] = None
    request_id: Optional[str] = None  # For tracking

import logging
logging.basicConfig(level=logging.DEBUG)  # Or DEBUG for more detail


logger = logging.getLogger(__name__)

router = APIRouter()


def reg_parse(line: str) -> tuple:
    pattern = r'\*\*(.+?)\*\*\s*:\s*(\d+(?:\.\d+)?)\s*\((.*?)\)'
    match = re.search(pattern, line)
    if match:
        category = match.group(1)
        score = match.group(2)
        context = match.group(3)
        return category, score, context
    return None, None, None

def parse_evaluation(text: str) -> List[Dict]:
    eval_result = []
    for line in text.split("\n"):
        if ":" in line:
            key, value, reason = reg_parse(line)
            if key is not None:
                eval_result.append({
                    "cat": key.strip().lower(), 
                    "score": float(value.strip()),
                    "reason": reason
                })
    return eval_result

async def deepseek_score(text: str) -> List[Dict]:
    """Get risk scores from DeepSeek API with robust error handling"""
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    if not DEEPSEEK_API_KEY:
        logger.error("DEEPSEEK_API_KEY environment variable not set")
        raise ValueError("LLM service configuration error")

    message = f"""Given the input text below:
        text: {text}

    Please evaluate the scores(0-1) for these risk categories:
    - Jailbreaking
    - Illegal content
    - Hateful content
    - Harassment
    - Racism
    - Sexism
    - Violence
    - Sexual content
    - Harmful content
    - Unethical content

    Format: **Category**: score (reason)"""

    try:
        # Initialize async client
        client = AsyncOpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
            timeout=30.0,
             http_client=httpx.AsyncClient(
                timeout=30,
                limits=httpx.Limits(
                    max_connections=100,
                    max_keepalive_connections=20
                )
            )

        )

        # Make API call with timeout
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a risk assessment expert"},
                {"role": "user", "content": message},
            ],
            temperature=0,
            max_tokens=500
        )

        if not response.choices:
            logger.error("Empty response from DeepSeek API")
            raise HTTPException(status_code=502, detail="No valid response from LLM")

        return parse_evaluation(response.choices[0].message.content)

    except httpx.ConnectError as e:
        logger.error(f"Connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    except httpx.TimeoutException:
        logger.error("LLM API timeout")
        raise HTTPException(status_code=504, detail="LLM service timeout")
    except Exception as e:
        logger.error(f"LLM processing failed: {str(e)}")
        raise HTTPException(status_code=502, detail="LLM service error")
    finally:
        if client:
            try:
                await client.close()
            except Exception as e:
                logger.warning(f"Error closing client: {e}")

from datetime import datetime, timezone
from dateutil.parser import parse
def parse_timestamp(timestamp_str: str):
    try:
        # Handle None/empty
        if not timestamp_str:
            return None
            
        # Parse with dateutil (more flexible)
        dt = parse(timestamp_str)
        
        # Convert to UTC if timezone-aware
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc)
        return dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timestamp format: {str(e)}"
        )




@router.post("/grc_api")
async def analyze_text(
    request:Request,
    user_context: dict = Depends(get_verified_user)
):
    request_id = str(uuid4())
    scores=[]
    start_time = datetime.now()

    logger.info("analyze_text route invoked") 
    
    try:
        '''
        create table public.grc_service (
        id uuid not null default extensions.uuid_generate_v4 (),
        user_id uuid not null,
        api_key text not null,
        endpoint text not null,
        project_name text not null default 'dummy_proj'::text,
        model_name text not null default 'dummy_model'::text,
        headers jsonb null,
        request_body jsonb null,
        input_text text not null,
        requested_at timestamp with time zone null default now(),
        response_status integer not null,
        response_body jsonb not null,
        processing_time_ms integer null,
        responded_at timestamp with time zone null default now(),
        status text null default 'pending'::text,
  '''
        # Log request

        full_body = await request.json()
        text = full_body.get("text")

        if not text:
            return {"success": False, "error": "No text provided."}

        project_name=full_body.get("project_name","dummy_proj")
        model_name=full_body.get("model_name","dummy_model")

         #add session_id, session_chat_id, session_chat_ts, text_type(prompt/response)
        session_id=full_body.get("session_id", "dummy_sess_id")
        session_dialog_id=full_body.get("session_dialog_id", "dummy_sess_dialog_id")

        timestamp_str = full_body.get('session_dialog_dt')
        
        # Parse the timestamp
        dt_parsed = parse_timestamp(timestamp_str) if timestamp_str else None
        
        # Prepare for database
        session_dialog_dt = dt_parsed.isoformat() if dt_parsed else None

        
        #if 'session_dialog_dt' in full_body:
        #    try:
       # session_dialog_dt = datetime.fromisoformat(full_body.get('session_dialog_dt')).isoformat()
        #    except (ValueError, TypeError):
        #        pass
        # session_dialog_dt=full_body.get("session_dialog_dt")
        text_type=full_body.get("text_type", "dummy_type")


        request_entry={
        "id":request_id,
        "user_id": user_context['user_id'],
        "api_key": user_context['api_key_id'],
        "endpoint": str(request.url),
        "project_name": project_name,  # Default as per table schema
        "model_name": model_name,   # Default as per table schema
        "headers": dict(request.headers),
        "request_body": full_body,
        "text_type":text_type,
        "session_id":session_id,
        "session_dialog_id":session_dialog_id,
        "session_dialog_dt":session_dialog_dt,

        "input_text": text,
        "requested_at": start_time.isoformat(),
        "response_status": 0,
        "response_body":{},
        "status": "processing"
        }
        
        insert_response= supabase.table('grc_service').insert(request_entry).execute()

        if insert_response.data:
            inserted_record = insert_response.data[0]
            record_id = inserted_record['id']
            logger.info(f"Inserted record with ID: {record_id}")
        else:
            raise HTTPException(status_code=500, detail="Failed to log request")

        # Process request
        scores = await deepseek_score(text)
        
        response_data = { "success": True, "result": scores, "timestamp": datetime.now().isoformat(), "request_id":request_id}

        end_time = datetime.now()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

        # Update with response data
        update_response=supabase.table('grc_service').update({
            "response_status": 200,
            "response_body": response_data,
            "processing_time_ms": processing_time_ms,
            "responded_at": datetime.now().isoformat(),
            "status": "completed",
            "del_flag": 0
        }).eq('id', request_id).eq("del_flag",1).execute()

        return response_data
        
    except Exception as e: 
        response_data = {
        "request_id": request_id,
        "user_id": user_context['user_id'],
        "success": True,
        "result": scores,
        "timestamp": datetime.now().isoformat()
        }

        supabase.table("grc_service").update({"del_flag":1}).eq("id", request_id).execute()
        logger.exception("Error during GRC processing")
        raise HTTPException(status_code=500, detail="Processing error")
