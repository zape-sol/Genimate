from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import subprocess
import tempfile
import os
import logging
import re
import uuid
from enum import Enum
from typing import Dict, Optional

IS_PROD = os.environ.get("IS_PROD", "false").lower() == "true"
PROD_URL = os.environ.get("PROD_URL", "http://localhost:8080")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

class ManimRequest(BaseModel):
    code: str

class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Job(BaseModel):
    id: str
    status: JobStatus = JobStatus.PENDING
    progress: int = 0
    video_path: Optional[str] = None
    details: Optional[str] = None

jobs: Dict[str, Job] = {}

def render_animation_in_background(job_id: str, code: str):
    jobs[job_id].status = JobStatus.PROCESSING
    
    class_name_match = re.search(r"class\s+(\w+)\((?:ThreeD)?Scene\):", code)
    if not class_name_match:
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].details = "Could not find Scene class in generated code"
        return

    class_name = class_name_match.group(1)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
        temp_file.write(code)
        temp_filename = temp_file.name
        script_name = os.path.splitext(os.path.basename(temp_filename))[0]

    try:
        media_dir = os.path.join(os.getcwd(), "media")
        os.makedirs(media_dir, exist_ok=True)
        
        command = [
            "manim",
            "-ql",
            temp_filename,
            class_name,
            "--media_dir",
            media_dir,
            "--progress_bar",
            "none"
        ]
        
        logging.info(f"Running command: {' '.join(command)}")
        
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if process.stderr:
            for line in iter(process.stderr.readline, ''):
                progress_match = re.search(r"(\d+)%", line)
                if progress_match:
                    jobs[job_id].progress = int(progress_match.group(1))
                logging.info(line.strip())

        process.wait()

        if process.returncode != 0:
            stdout_output = process.stdout.read() if process.stdout else ""
            logging.error(f"Manim failed: {stdout_output}")
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = f"Failed to render animation: {stdout_output}"
            return

        video_file_path = os.path.join(media_dir, "videos", script_name, "480p15", f"{class_name}.mp4")

        if not os.path.exists(video_file_path):
            logging.error(f"Video file not found at {video_file_path}")
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = "Video file not found after rendering."
            return

        if IS_PROD:
            video_url_path = f"{PROD_URL}/media/videos/{script_name}/480p15/{class_name}.mp4"
        else:
            video_url_path = f"http://localhost:8080/media/videos/{script_name}/480p15/{class_name}.mp4"
        
        jobs[job_id].status = JobStatus.COMPLETED
        jobs[job_id].video_path = video_url_path
        jobs[job_id].progress = 100

    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].details = str(e)
    finally:
        os.remove(temp_filename)

@app.post("/generate", status_code=202)
async def generate_animation(request: ManimRequest, background_tasks: BackgroundTasks):
    code = request.code

    if not code:
        raise HTTPException(status_code=400, detail="Code is required")

    job_id = str(uuid.uuid4())
    jobs[job_id] = Job(id=job_id)
    
    background_tasks.add_task(render_animation_in_background, job_id, code)
    
    return {"job_id": job_id}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

app.mount("/media", StaticFiles(directory="media"), name="media")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)