
#/api/v1/fastapi_app/routers/drift.py
#from transformers import pipeline
from collections import defaultdict

import numpy as np

import re
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from openai import OpenAI, AsyncOpenAI
from typing import List, Dict
from uuid import uuid4
from datetime import datetime  # This imports the datetime class

from dotenv import load_dotenv

#from ..schemas import NERRequest, NERResponse, NERScore
from ..dependencies import verify_api_key, get_verified_user
from ..database import supabase

import logging
logging.basicConfig(level=logging.DEBUG)  # Or DEBUG for more detail


logger = logging.getLogger(__name__)

router = APIRouter()

#from detoxify import Detoxify

load_dotenv()


HF_TOKEN = os.getenv("HF_TOKEN")  # store your Hugging Face token in env
headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

API_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert"

#----------------------------------------------back up for toxict

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
                    "label": key.strip().lower(), 
                    "score": float(value.strip()),
                    "reason": reason
                })
    return eval_result

async def deepseek_toxicty(text: str) -> List[Dict]:
    """Get risk scores from DeepSeek API with robust error handling"""
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    if not DEEPSEEK_API_KEY:
        logger.error("DEEPSEEK_API_KEY environment variable not set")
        raise ValueError("LLM service configuration error")

    message = f"""Given the input text below:
        text: {text}

    Please evaluate the scores(0-1 and leave five digits) for these toxicity categories:

    - toxic
    - obscene
    - threat
    - insult    
    - identity_hate
    - severe_toxic

    Format: **Category**: score (reason)"""

    try:
        # Initialize async client
        client = AsyncOpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
            timeout=30.0,
            http_client=httpx.AsyncClient()  # Explicit HTTP client, to address implicit proxy error

        )

        # Make API call with timeout
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a text toxicity assessment expert"},
                {"role": "user", "content": message},
            ],
            temperature=0,
            max_tokens=500
        )

        if not response.choices:
            logger.error("Empty response from DeepSeek API")
            raise HTTPException(status_code=502, detail="No valid response from LLM")

        return parse_evaluation(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")


#os.environ["TORCH_HOME"] = "./model_cache/huggingface/detoxity"
#model = Detoxify("original")

#----------------------------------------------------------funcitons for toxicity------------------------
#from detoxify import Detoxify

#def evaluate_toxicity(text):
#@    results = model.predict(text)
#   return results


"""

def evaluate_toxicity(text):

    payload={"inputs": text}
    results = httpx.post(API_URL, headers=headers, json=payload)
    return results.json()[0][0]['score']

#----------------------------------------------------------funcitons for toxicity------------------------


#------------------------------------------------------------functions for reability-----------------------
def count_syllables(word):
    # Simple syllable counter (approximation)
    word = word.lower()
    syllable_count = 0
    vowels = "aeiouy"
    if word[0] in vowels:
        syllable_count += 1
    for i in range(1, len(word)):
        if word[i] in vowels and word[i - 1] not in vowels:
            syllable_count += 1
    if word.endswith("e"):
        syllable_count -= 1
    return syllable_count if syllable_count > 0 else 1
"""

#def flesch_reading_ease(text):
#    sentences = re.split(r'[.!?]', text)
#    words = re.findall(r'\b\w+\b', text)
#    syllable_count = sum(count_syllables(word) for word in words)
    
#    total_sentences = len(sentences)
 #   total_words = len(words)
    
  #  if total_sentences == 0 or total_words == 0:
   #     return 0
    
   # return 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (syllable_count / total_words)

# Example usage
#text = 
#The Flesch Reading Ease score is a widely used measure of readability. 
#It calculates how easy a text is to read based on sentence length and word complexity. 
#The higher the score, the easier the text is to understand.
#"""


#print("Flesch Reading Ease Score:", score)

#----------------------------------------------------function for readability---------------------------



#---------------------------------------------------function for stop-word ratio-------------------------
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# 1. Get the project root directory (where your nltk_data_* folders live)
#project_root = Path(__file__).parent.parent.parent.absolute()  # Adjust based on your structure

#project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

#project_root = os.path.abspath(os.path.join(os.getcwd(), '..', '..', '..'))

project_root = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(project_root, '../../../'))



logger.info(f"Vercel working directory: {os.getcwd()}")
logger.info(f"__file__ location: {__file__}")
logger.info(f"Resolved project_root: {project_root}")


# 2. Define your NLTK directories 
nltk_dirs = [
    os.path.join(project_root, 'nltk_data_stopwords'),
    os.path.join(project_root, 'nltk_data_punkt'),
    os.path.join(project_root, 'nltk_data_punkt_tab')
]




# 3. Add to NLTK path (only if directory exists)
for dir_path in nltk_dirs:
    logger.info(f"Checking NLTK path: {dir_path} — Exists? {os.path.exists(dir_path)}")
    if os.path.exists(dir_path):
        nltk.data.path.append(dir_path)
        logger.info(f"Added NLTK path: {dir_path}")


"""
def stop_word_ratio(text, language='english'):
    stop_words = set(stopwords.words(language))
    words = word_tokenize(text)
    total_words = len(words)
    print(total_words)
    stop_word_count = sum(1 for word in words if word.lower() in stop_words)
    print(stop_word_count)

    if total_words == 0:
        return 0.0

    return stop_word_count / total_words

# Example usage
#text = "This is an egg and is a good egg"
#ratio = stop_word_ratio(text)
"""



async def get_metrics(text, language='english'):
    # the logic to get 
    payload={"inputs": text}
    
    labels=['toxic','obscene','threat','insult','identity_hate','severe_toxic']

    try:
        # Try HuggingFace first
        payload = {"inputs": text}
        async with httpx.AsyncClient() as client:
            response = await client.post(API_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()[0]
            score_dict = {item['label']: item['score'] for item in result}
    except Exception as hf_error:
        logger.error(f"Try Alternative call")
        try:
            # Fall back to DeepSeek
            result = await deepseek_toxicty(text)
            score_dict = {item['label']: item['score'] for item in result}
        except Exception as ds_error:
            logger.error(f"Alternative also failed")
            raise HTTPException(status_code=500, detail="Failed to evaluate toxicity")


    # stopword ratio
    stop_words = set(stopwords.words(language))
    words = word_tokenize(text)
    total_words = len(words)
    print(total_words)
    stop_word_count = sum(1 for word in words if word.lower() in stop_words)
    print(stop_word_count)

    if total_words == 0:
        return 0.0

    ratio=stop_word_count / total_words


    #readbility score

    sentences = re.split(r'[.!?]', text)
    words = re.findall(r'\b\w+\b', text)


    syllable_count_all=0
    for word in words:
        word = word.lower()
        syllable_count = 0
        vowels = "aeiouy"
        if word[0] in vowels:
            syllable_count += 1
        for i in range(1, len(word)):
            if word[i] in vowels and word[i - 1] not in vowels:
                syllable_count += 1
        if word.endswith("e"):
            syllable_count -= 1
        syllable_count_all+=(syllable_count if syllable_count > 0 else 1)


    #syllable_count = sum(count_syllables(word) for word in words)
    
    total_sentences = len(sentences)
    total_words = len(words)
    
    if total_sentences == 0 or total_words == 0:
        return 0
    
    readability_score=206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (syllable_count_all / total_words)


    return (
        score_dict.get('toxic', 0.000),
        score_dict.get('obscene', 0.000),
        score_dict.get('threat', 0.000),
        score_dict.get('insult', 0.000),
        score_dict.get('identity_hate', 0.000),
        score_dict.get('severe_toxic', 0.000),
        ratio,
        readability_score
    )
    #return toxic,obscene,threat,insult,identity_hate,severe_toxic,ratio,  readability_score


#-----------------------------------------------funciton for stop-word-ratio

@router.post("/drift")
async def drift_metrics(
  request:Request,
  user_context: dict = Depends(get_verified_user)
  ):
    logger.info(f"request is {request}") 

    request_id = str(uuid4())
    scores=[]
    start_time = datetime.now()

    full_body = await request.json()

    logger.info("entities_extract route invoked") 

    text = full_body.get("text")
    project_name=full_body.get("project_name","dummy_project")
    model_name=full_body.get("model_name","dummy_model")

    logger.info(f"Request payload: {text}")

    
    if not text:
            return {"success": False, "error": "No text provided."}
    
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

        

        
        metrics = await get_metrics(text)  # Must await here too
        (toxicity_score, obscene, threat, insult, identity_hate, severe_toxic, stopwords_ratio, readability) = metrics

        #toxicity_score,  obscene,threat, insult, identity_hate, severe_toxic, stopwords_ratio, readability= get_metrics(text)
        #=evaluate_toxicity(text)

        #readability = flesch_reading_ease(text)

        #stopwords_ratio = stop_word_ratio(text)



        end_time = datetime.now()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

        response_data={
            "success":True,
            "readability":readability,
            "toxicity":toxicity_score,
            "stopwords_ratio":stopwords_ratio, 
            "obscene":obscene,
            "threat":threat,
            "insult":insult,
            "identity_hate":identity_hate,
            "severe_toxic":severe_toxic,
            "request_id":request_id
        }

        # Update with response data
        update_response=supabase.table('grc_service').update({
            "response_status": 200,
            "response_body": response_data,
            "processing_time_ms": processing_time_ms,
            "responded_at": datetime.now().isoformat(),
            "status": "completed"
        }).eq('id', request_id).eq("del_flag",0).execute()

        return response_data

    except Exception as e:
        response_data = {
        "request_id": request_id,
        "user_id": user_context['user_id'],
        "success": False,
        "result": {},
        "timestamp": datetime.now().isoformat()
        }

        #supabase.table("grc_service").update({"del_flag":1}).eq("id", request_id).execute()
        logger.error(f"Drift failed: {e}")
        return {"success": False, "error": str(e)}


