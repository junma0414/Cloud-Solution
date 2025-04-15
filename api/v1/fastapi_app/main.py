#api/v1/fastapi_app/main.py
from fastapi import FastAPI, Request,APIRouter, Depends, HTTPException

from fastapi.middleware.cors import CORSMiddleware

import os
from supabase import create_client
from dotenv import load_dotenv
import logging
import traceback

from mangum import Mangum  # converts ASGI to AWS Lambda (Vercel compatible)


from api.v1.fastapi_app.routers import core, grc_api,ner,drift

load_dotenv() #check .env in current local directory

app = FastAPI()

logger = logging.getLogger(__name__)

#logger.info(f"Received payload: {request.json()}")




# Configure CORS for your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #[os.getenv("FRONTEND_URL", "https://obserpedia.com")],
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


app.include_router(
    ner.router,
    prefix="/api/v1",
    tags=["ner"]

)

app.include_router(
    drift.router,
    prefix="/api/v1",
    tags=["drift"]

)



logger.info(app.routes)

# absolute path: http://localhost:xxxx/api/python
#@app.get("/api/v1/python")
#async def root():
#    return {"message": "Hello World！"}




'''
@app.middleware("http")
async def debug_headers(request: Request, call_next):
    print("Headers received:")
    for k, v in request.headers.items():
        print(f"{k}: {v}")
    return await call_next(request)

@app.get("/test")
async def test_route():
    return {"message": "Middleware test successful"}
'''


#handler = Mangum(app)  # for Vercel to recognize
