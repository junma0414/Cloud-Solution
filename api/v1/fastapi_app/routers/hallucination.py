# api/v1/fastapi_app/grc.py
import ipaddress


from fastapi import APIRouter, HTTPException, Request
from openai import AsyncOpenAI, APITimeoutError
import httpx
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


INTERNAL_TOKEN= os.getenv("INTERNAL_TOKEN") 
#from ..dependencies import verify_api_key, get_verified_user


router = APIRouter()

INTERNAL_NETWORKS = [
    "127.0.0.0/8",       # Localhost
    "10.0.0.0/8",        # Private network
    "172.16.0.0/12",     # Private network
    "192.168.0.0/16",    # Private network
    "::1/128"            # IPv6 localhost
]

def is_internal_request(client_ip: str) -> bool:
    try:
        ip = ipaddress.ip_address(client_ip.split(':')[0])  # Handle IPv6
        return any(ip in ipaddress.ip_network(net) for net in INTERNAL_NETWORKS)
    except ValueError:
        return False

async def deepseek_hallucination_score(text: str, response: str) -> str:
    """Check for hallucinations in the response using DeepSeek API."""
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    if not DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY environment variable not set")

    message = f"""Given the input and output response below:
        Input text: {text}
        Output response: {response}

        Please identify any hallucinated or factually incorrect parts in the response. 
        Provide a detailed justification for your assessment. """

    conversation = [
        {"role": "system", "content": "You are a fact-checking assistant"},
        {"role": "user", "content": message}
    ]

    full_reply = ""
    try:
        client = AsyncOpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
            timeout=60.0,  # Increased timeout
            http_client=httpx.AsyncClient(
                timeout=60.0,
                limits=httpx.Limits(
                    max_connections=100,
                    max_keepalive_connections=20
                )
            )
        )

        step=0
        while True:
            api_response = await client.chat.completions.create(
                model="deepseek-chat",
                messages=conversation,
                temperature=0,
                max_tokens=500
            )



            if not api_response.choices:
                raise HTTPException(status_code=502, detail="No valid response")

            reply = api_response.choices[0].message.content
            full_reply += reply
            finish_reason = api_response.choices[0].finish_reason

            step+=1



            if finish_reason == "stop":
                break
            else:
                # Add assistant response to maintain context
                conversation.append({"role": "assistant", "content": reply})
                # Prompt LLM to continue
                conversation.append({"role": "user", "content": "Continue."})

            if step==3:
                return full_reply+'...[truncated]'

        return full_reply

    except httpx.ReadTimeout:
        raise HTTPException(status_code=504, detail="DeepSeek API request timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DeepSeek API error: {str(e)}")

@router.post("/hallucination")
async def check_hallucination(request: Request):
    
    client_ip = request.client.host
    internal_token = request.headers.get("X-Internal-Token")

    if not (is_internal_request(client_ip) or internal_token == INTERNAL_SECRET):
        raise HTTPException(
            status_code=403,
            detail="External access not permitted"
        )

    full_body = await request.json()
    prompt = full_body.get("prompt")

    response=full_body.get("response")
    if (not prompt) or (not response):
        return {"success": False, "error": "No text provided."}

    try:
        analysis_result = await deepseek_hallucination_score(prompt, response)
        return {
            "success": True,
            "analysis": analysis_result
        }
    except (httpx.TimeoutException, APITimeoutError):
        return {
            "success": False,
            "analysis": "Request Timeout, Please try later"
        }

    except HTTPException as he:
        return {
            "success": False,
            "error": he.detail
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }