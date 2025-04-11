#api/v1/fastapi_app/main.py
from fastapi import FastAPI, Request,APIRouter, Depends, HTTPException

from fastapi.middleware.cors import CORSMiddleware

import os
from supabase import create_client
from dotenv import load_dotenv
import logging
import traceback

from api.v1.fastapi_app.routers import core, grc_api

load_dotenv() #check .env in current local directory

app = FastAPI()

logger = logging.getLogger(__name__)


# Configure CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "https://obserpedia.com")],
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
    grc_api.router,
    prefix="/api/v1",
    tags=["GRC_api"]
)



# ablution path: http://localhost:xxxx/api/python
@app.get("/api/python")
async def root():
    return {"message": "Hello World！"}

