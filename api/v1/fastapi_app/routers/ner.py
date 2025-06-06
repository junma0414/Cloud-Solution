#from transformers import pipeline
from collections import defaultdict

import numpy as np


import requests as nrequests

import re
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from openai import OpenAI, AsyncOpenAI
from typing import List, Dict, Optional
from uuid import uuid4
from datetime import datetime  # This imports the datetime class

from ..dependencies import verify_api_key, get_verified_user
from ..database import supabase

from dotenv import load_dotenv


from pydantic import BaseModel
from datetime import datetime





import logging
logging.basicConfig(level=logging.DEBUG)  # Or DEBUG for more detail


logger = logging.getLogger(__name__)

router = APIRouter()

load_dotenv()

#run once and copy from .cache/xxxx to path 

#model_path = os.getenv("NER_MODEL_PATH", "./model_cache/huggingface/models--dslim--bert-base-NER/snapshots/d1a3e8f13f8c3566299d95fcfc9a8d2382a9affc")
#model_path = "./model_cache/huggingface/models--dslim--bert-base-NER/snapshots/d1a3e8f13f8c3566299d95fcfc9a8d2382a9affc"
#ner_pipeline = pipeline("ner", model=model_path, aggregation_strategy="simple")
#ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")

HF_TOKEN = os.getenv("HF_TOKEN")  # store your Hugging Face token in env
headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

API_URL = "https://api-inference.huggingface.co/models/dslim/bert-base-NER"

def run_ner(text: str):
    payload = {"inputs": text}
    response = nrequests.post(API_URL, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

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

@router.post("/ner")
async def extract_entities(
  request:Request,
  user_context: dict = Depends(get_verified_user)
  ):

    request_id = str(uuid4())

    scores=[]
    start_time = datetime.now()

    full_body = await request.json()

    text=full_body.get('text')

    logger.info("entities_extract route invoked") 
    logger.info(f"Request payload: {text}")

    project_name=full_body.get("project_name","dummy_project")
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
    #session_dialog_dt = datetime.fromisoformat(full_body.get('session_dialog_dt')).isoformat()
    #    except (ValueError, TypeError):
    #        pass
   # session_dialog_dt=full_body.get("session_dialog_dt")
    text_type=full_body.get("text_type", "dummy_type")


    
    try:
        # Log request
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

        #{
         #       "text": ner_request.text,
          #      "project_name": ner_request.project_name,
           #     "model_name": ner_request.modle_name,
            #    "topN":ner_request.topn,
                # Add other relevant request body fields if available
            #},
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



        if not text:
            return {"success": False, "error": "No text provided."}

        logger.info("Running NER on submitted text.")

        entities=run_ner(text)

        entity_dict= defaultdict(int)
        for e in entities:
            key=(e["word"],e['entity_group'])
            entity_dict[key] += 1

        entity_len=len(entity_dict)
        entity_count_all=int(np.sum(list(entity_dict.values())))


        logger.info(f"len of entities is {entity_len}，total counts of entity is {entity_count_all}")

        topn_request=full_body.get("topn")
       
        if not topn_request:
            topn=entity_len

        if topn_request == '0':  #return all
            topn=entity_len



        topn_entities = sorted(entity_dict.items(), key=lambda item: item[1], reverse=True)[0:topn]

        ner_scores = [{"word":word, "count":int(v), "entity_group":group} for (word,group), v in topn_entities]

        logger.info(f"ner_scores: {ner_scores}")



        end_time = datetime.now()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

        response_data={
            "success":True,
            "entity":ner_scores,
            "entity_len":entity_len,
            "entity_count_total":entity_count_all,
            "request_id":request_id
        }

        # Update with response data
        update_response=supabase.table('grc_service').update({
            "response_status": 200,
            "response_body": response_data,
            "processing_time_ms": processing_time_ms,
            "responded_at": datetime.now().isoformat(),
            "status": "completed",
            "del_flag":0
        }).eq('id', request_id).execute()

        """
        success: bool
        entity: List[NERScore]
        entity_count: int
        entity_total_count: int
        error: Optional[str] = None
        request_id: Optional[str] = None  # For tracking
        """  
        return response_data

    except Exception as e:
        response_data = {
        "request_id": request_id,
        "user_id": user_context['user_id'],
        "success": True,
        "result": {},
        "timestamp": datetime.now().isoformat()
        }

        #supabase.table("grc_service").update({"del_flag":1}).eq("id", request_id).execute()
        logger.error(f"NER extraction failed: {e}")
        return {"success": False, "error": str(e)}


