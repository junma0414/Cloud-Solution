import modal
from fastapi import FastAPI, UploadFile, HTTPException, Request, File, Form, Body
import os
import zipfile
import io
import uuid
from typing import List, Dict
from pydantic import BaseModel, Field
import subprocess
from pathlib import Path
import shutil


app = modal.App("model-handler")

volume = modal.Volume.from_name("llm-models")

image = modal.Image.debian_slim().pip_install(
    "torch>=2.0.0",
    "transformers[torch]",
    "accelerate>=0.21.0",
    "fastapi",
    "pydantic",
    "pathlib",
    "python-multipart"
)

class UploadSession(BaseModel):
    session_id: str
    target_path: str
    chunks_received: int = 0
    file_chunks: Dict[str, List[str]] = {}  # Tracks chunks for each original file path
    #chunk_metadata: List[dict] = []
   
class DeploymentRequest(BaseModel):
    script: str
    model_name: str


active_sessions = {}

def ensure_safe_path(base_path: str, target_path: str) -> str:
    """Ensure the target path is within the allowed directory"""
    full_path = os.path.abspath(os.path.join(base_path, target_path))
    if not full_path.startswith(base_path):
        raise ValueError("Path traversal attempt detected")
    return full_path

# delete folder recursively
def delete_path_recursive(path: str):
    """Recursively delete a directory using only os module"""
    if not os.path.exists(path):
        return False
        
    if os.path.isfile(path):
        os.remove(path)
        return True
        
    # Handle directory
    for root, dirs, files in os.walk(path, topdown=False):
        for name in files:
            file_path = os.path.join(root, name)
            os.remove(file_path)
        for name in dirs:
            dir_path = os.path.join(root, name)
            os.rmdir(dir_path)
    os.rmdir(path)
    return True

#@modal.asgi_app()
async def process_folder_upload(zip_content: bytes, target_path: str):
    """Extract uploaded zip folder to target location"""
    base_path = "/model"
    extract_path = ensure_safe_path(base_path, target_path)
    
    try:
        os.makedirs(extract_path, exist_ok=True)
        
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zip_ref:
            for file_info in zip_ref.infolist():
                file_path = ensure_safe_path(base_path, os.path.join(target_path, file_info.filename))
                if file_info.is_dir():
                    os.makedirs(file_path, exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, "wb") as f:
                        f.write(zip_ref.read(file_info.filename))
        
        return {"status": "success", "path": target_path}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.function(image=image, volumes={"/model": volume}, gpu="A10G", timeout=600)
@modal.asgi_app()
def handle_task():


    app = FastAPI()

    @app.post("/api/upload/start")
    async def start_upload(target_path: str = "/model"):
        """Initialize a chunked upload session"""
        session_id = str(uuid.uuid4())
        full_path = ensure_safe_path("/model", target_path)
        os.makedirs(full_path, exist_ok=True)

        print(f"[start upload]full_path: {full_path}")
        
        active_sessions[session_id] = UploadSession(
            session_id=session_id,
            target_path=target_path,
            chunks_received=0,
            file_chunks={}
        )
        return {"session_id": session_id}

    @app.post("/api/upload/chunk")
    async def upload_chunk(
        file: UploadFile = File(...),
        session_id: str = Form(...),
        chunk_index: int = Form(...),
        original_filename: str = Form(...),
        relative_path: str = Form(None)
    ):
        if session_id not in active_sessions:
            raise HTTPException(404, detail="Session not found")

        session = active_sessions[session_id]
        
        # Create the original file path structure
        #file_path = os.path.join(relative_path, original_filename) if relative_path else original_filename
        file_path=relative_path
        
        # Create temporary chunk path
        chunk_dir = "/model/.tmp"
        os.makedirs(chunk_dir, exist_ok=True)
        chunk_filename = f"{session_id}_{file_path.replace('/', '_')}_{chunk_index}.part"
        chunk_path = os.path.join(chunk_dir, chunk_filename)

        try:
            # Save the chunk
            with open(chunk_path, "wb") as f:
                while content := await file.read(1024 * 1024):  # 1MB chunks
                    f.write(content)

            # Track the chunk for this file
            if file_path not in session.file_chunks:
                session.file_chunks[file_path] = []
            session.file_chunks[file_path].append(chunk_path)

            print("[uploading chunk]sessoin informaiton:", session)

            return {
                "status": "success",
                "chunk_path": chunk_path,
                "original_path": file_path
            }
        except Exception as e:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)
            raise HTTPException(500, detail=f"Chunk upload failed: {str(e)}")

    @app.post("/api/upload/complete")
    async def complete_upload(session_id: str):
        if session_id not in active_sessions:
            raise HTTPException(404, detail="Session not found")

        session = active_sessions[session_id]
        base_dir = "/model"
        tmp_dir='/model/.tmp'
        
        try:
            # 1. Reconstruct files with proper path handling
            for original_path, chunk_paths in session.file_chunks.items():
                # Full target path (e.g., /model/distill_model/config.json)

                print(f"[complete upload]original path is:{original_path}")
                target_path = os.path.join(base_dir, original_path)
                
                # Ensure parent directory exists (e.g., /model/distill_model/)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)

                # Verify we're creating a file (not directory)
                if target_path.endswith('/'):
                    raise ValueError(f"Invalid path - ends with slash: {target_path}")

                # Combine chunks into the final FILE
                with open(target_path, "wb") as outfile:
                    for chunk_path in sorted(chunk_paths):
                        with open(chunk_path, "rb") as infile:
                            outfile.write(infile.read())
                        os.remove(chunk_path)  # Clean up chunk

                print(f"Created file at: {target_path}")  # Debug log


            if os.path.exists(tmp_dir):
                shutil.rmtree(tmp_dir)
                print(f"Successfully removed temp directory: {tmp_dir}")
                #cleanup_success = True

            # 2. Clean up session
            del active_sessions[session_id]

            return {
                "status": "complete",
                "restored_files": len(session.file_chunks),
                "example_restored_file": target_path  # For verification
            }

        except Exception as e:
            raise HTTPException(500, detail=str(e))

    @app.post("/api/deletedir")
    async def delete_folder(
        request:Request # Changed default to match your volume mount
          ):
        """Delete directory recursively"""

        path=  request.query_params.get("path")
        modelName = request.query_params.get("modelName")

        if not path:
            raise HTTPException(status_code=400, detail="Path/folder parameter is required")
        
        try:
            full_path = ensure_safe_path("/model", path)

            print("full path is: ",full_path)
        
            if not os.path.exists(full_path):
                return {
                    "status": "error",
                    "error": f"Path not found: {path}"
                }
        
            success = delete_path_recursive(full_path)
        
            if not success:
                raise Exception("Deletion failed")


            app_stop = modal.App.lookup(modelName)
            if app_stop:
                app_stop.stop()  # Stop the app
            else:
                print(f"App {modelName} not found")




            return {
                "status": "success",
                "app": modelName,
                "deleted": True
            }



        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={
                    "status": "error",
                    "error": str(e),
                    "path": path
                }
            )       





    @app.get("/api/checkdir")
    async def check_folder(path: str = ""):
        full_path = ensure_safe_path("/model", path)
        
        if not os.path.exists(full_path):
            return {
                "type": "directory",
                "path": path,
                "exists":False,
                "status":"success"
            }

        
        if os.path.isfile(full_path):
            return {
                "type": "file",
                "path": path,
                "exists":True,
                "status":"success"
            }
        
        
        return {
            "type": "directory",
            "path": path,
            "exists":True,
            "status":"success"
        }

    '''
    @app.post("/api/deploy")
    async def deploy_app(request: DeploymentRequest = Body(...)):
        try:
            # Validate model_name to prevent path traversal
            if not request.model_name.isidentifier():
                raise ValueError("Invalid model name format")

            modal_path=shutil.which('modal')

            if not modal_path:
                raise HTTPException(
                status_code=500,
                detail="Modal CLI not found. Install with: pip install modal-client"
            )
        
            script_path = Path(f"/tmp/{request.model_name}.py")
            script_path.write_text(request.script, encoding='utf-8')
        
            result = subprocess.run(
                [modal_path, "deploy", str(script_path)],
                capture_output=True,
                text=True,
                check=False
            )
        
            if result.returncode != 0:
                raise RuntimeError(result.stderr)
            
            return {
                "status": "success",
                "deployment_id": request.model_name,
                "logs": result.stdout
            }
        
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": str(e),
                    "type": type(e).__name__
                }
            )
    '''
  
    return app



