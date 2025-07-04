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
import time
from typing import Dict, Optional
from datetime import datetime, timedelta

IS_PROD = os.environ.get("IS_PROD", "false").lower() == "true"
PROD_URL = os.environ.get("PROD_URL", "http://localhost:8080")

# Job cleanup configuration
MAX_JOBS_IN_MEMORY = 100
JOB_CLEANUP_HOURS = 24

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
    start_time: Optional[float] = None
    duration: Optional[float] = None
    created_at: datetime = datetime.now()

    class Config:
        arbitrary_types_allowed = True

jobs: Dict[str, Job] = {}

def render_animation_in_background(job_id: str, code: str):
    try:
        # Ensure job exists and update status
        if job_id not in jobs:
            logging.error(f"Job {job_id} not found when starting background task")
            return
            
        jobs[job_id].status = JobStatus.PROCESSING
        jobs[job_id].start_time = time.time()
        jobs[job_id].progress = 5
        
        # Extract class name with improved regex
        class_name_match = re.search(r"class\s+(\w+)\s*\(\s*(?:ThreeD)?Scene\s*\)\s*:", code)
        if not class_name_match:
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = "Could not find Scene class in generated code"
            jobs[job_id].duration = time.time() - jobs[job_id].start_time
            return

        class_name = class_name_match.group(1)
        jobs[job_id].progress = 15

        # Create temporary file with better error handling
        temp_filename = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
                temp_file.write(code)
                temp_filename = temp_file.name
                script_name = os.path.splitext(os.path.basename(temp_filename))[0]
        except Exception as e:
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = f"Failed to create temporary file: {str(e)}"
            jobs[job_id].duration = time.time() - jobs[job_id].start_time
            return

        jobs[job_id].progress = 25

        # Setup media directory
        media_dir = os.path.join(os.getcwd(), "media")
        os.makedirs(media_dir, exist_ok=True)
        
        command = [
            "manim",
            "-qp",  # Preview quality - much faster
            "--fps", "15",  # Lower FPS for faster rendering
            "--format", "mp4",  # Force MP4 format
            "--write_to_movie",  # Force writing to movie file
            temp_filename,
            class_name,
            "--media_dir",
            media_dir,
            "--progress_bar",
            "none",
            "--disable_caching"  # Disable caching for faster startup
        ]
        
        logging.info(f"Running command: {' '.join(command)}")
        logging.info(f"Temporary file: {temp_filename}")
        logging.info(f"Class name: {class_name}")
        jobs[job_id].progress = 35
        
        # Run subprocess with better error handling and timeout
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Handle stderr output properly with timeout
        stderr_output = ""
        stdout_output = ""
        
        try:
            # Wait for process with timeout
            stdout_output, stderr_output = process.communicate(timeout=120)  # 2 minute timeout
            
            # Process stderr for progress updates
            if stderr_output:
                for line in stderr_output.split('\n'):
                    if line.strip():
                        progress_match = re.search(r"(\d+)%", line)
                        if progress_match:
                            progress = min(90, 35 + int(progress_match.group(1)) * 0.5)
                            jobs[job_id].progress = int(progress)
                        logging.info(f"Manim stderr: {line.strip()}")
                        
        except subprocess.TimeoutExpired:
            process.kill()
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = "Animation rendering timed out (2 minutes)"
            jobs[job_id].duration = time.time() - jobs[job_id].start_time
            return

        if process.returncode != 0:
            error_msg = f"Manim failed with return code {process.returncode}. Stdout: {stdout_output}. Stderr: {stderr_output}"
            logging.error(error_msg)
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = error_msg
            jobs[job_id].duration = time.time() - jobs[job_id].start_time
            return

        jobs[job_id].progress = 95

        # Check if video file exists - handle both single file and partial files
        video_file_path = os.path.join(media_dir, "videos", script_name, "480p15", f"{class_name}.mp4")

        if not os.path.exists(video_file_path):
            # Check for partial movie files directory first
            partial_files_dir = os.path.join(media_dir, "videos", script_name, "480p15", "partial_movie_files", class_name)
            
            if os.path.exists(partial_files_dir):
                # Find all partial MP4 files
                partial_files = [f for f in os.listdir(partial_files_dir) if f.endswith('.mp4')]
                if partial_files:
                    # Sort by modification time and take the latest/largest
                    partial_files.sort(key=lambda x: os.path.getmtime(os.path.join(partial_files_dir, x)), reverse=True)
                    latest_partial = partial_files[0]
                    video_file_path = os.path.join(partial_files_dir, latest_partial)
                    logging.info(f"Using partial movie file: {video_file_path}")
                else:
                    logging.error("Partial movie files directory exists but no MP4 files found")
                    jobs[job_id].status = JobStatus.FAILED
                    jobs[job_id].details = "Partial movie files directory exists but no MP4 files found"
                    jobs[job_id].duration = time.time() - jobs[job_id].start_time
                    return
            else:
                # Try alternative paths for different quality settings
                alt_paths = [
                    os.path.join(media_dir, "videos", script_name, "360p15", f"{class_name}.mp4"),
                    os.path.join(media_dir, "videos", script_name, "720p30", f"{class_name}.mp4"),
                    os.path.join(media_dir, "videos", script_name, f"{class_name}.mp4")
                ]
                
                video_file_path = None
                for alt_path in alt_paths:
                    if os.path.exists(alt_path):
                        video_file_path = alt_path
                        logging.info(f"Found video at alternative path: {alt_path}")
                        break
                
                if not video_file_path:
                    # List all files in the videos directory for debugging
                    videos_dir = os.path.join(media_dir, "videos", script_name)
                    if os.path.exists(videos_dir):
                        for root, dirs, files in os.walk(videos_dir):
                            logging.info(f"Directory: {root}, Files: {files}")
                    
                    logging.error(f"Video file not found at any expected location for script: {script_name}")
                    jobs[job_id].status = JobStatus.FAILED
                    jobs[job_id].details = f"Video file not found after rendering. Checked paths: {alt_paths[0]}"
                    jobs[job_id].duration = time.time() - jobs[job_id].start_time
                    return

        # Set video URL based on the actual file path found
        relative_path = os.path.relpath(video_file_path, media_dir).replace("\\", "/")
        
        if IS_PROD:
            video_url_path = f"{PROD_URL}/media/{relative_path}"
        else:
            video_url_path = f"http://localhost:8080/media/{relative_path}"
        
        # Update job completion
        jobs[job_id].status = JobStatus.COMPLETED
        jobs[job_id].video_path = video_url_path
        jobs[job_id].progress = 100
        jobs[job_id].duration = time.time() - jobs[job_id].start_time

    except Exception as e:
        logging.error(f"An unexpected error occurred in job {job_id}: {e}")
        if job_id in jobs:
            jobs[job_id].status = JobStatus.FAILED
            jobs[job_id].details = str(e)
            jobs[job_id].duration = time.time() - jobs[job_id].start_time if jobs[job_id].start_time else 0
    finally:
        # Clean up temp file
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                logging.error(f"Failed to remove temp file {temp_filename}: {e}")
        
        # Cleanup old jobs periodically
        cleanup_old_jobs()

@app.post("/generate", status_code=202)
async def generate_animation(request: ManimRequest, background_tasks: BackgroundTasks):
    code = request.code

    if not code:
        raise HTTPException(status_code=400, detail="Code is required")

    job_id = str(uuid.uuid4())
    
    # Create job with proper initialization to prevent race conditions
    job = Job(
        id=job_id,
        status=JobStatus.PENDING,
        progress=0,
        created_at=datetime.now()
    )
    
    # Store job before starting background task
    jobs[job_id] = job
    
    # Start background task
    background_tasks.add_task(render_animation_in_background, job_id, code)
    
    return {"job_id": job_id}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/health")
async def health_check():
    """Health check endpoint with system information"""
    return {
        "status": "healthy",
        "active_jobs": len(jobs),
        "pending_jobs": len([j for j in jobs.values() if j.status == JobStatus.PENDING]),
        "processing_jobs": len([j for j in jobs.values() if j.status == JobStatus.PROCESSING]),
        "completed_jobs": len([j for j in jobs.values() if j.status == JobStatus.COMPLETED]),
        "failed_jobs": len([j for j in jobs.values() if j.status == JobStatus.FAILED])
    }

@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a specific job to free up memory"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    del jobs[job_id]
    return {"message": f"Job {job_id} deleted successfully"}

app.mount("/media", StaticFiles(directory="media"), name="media")

def cleanup_old_jobs():
    """Remove jobs older than JOB_CLEANUP_HOURS to prevent memory leaks"""
    try:
        cutoff_time = datetime.now() - timedelta(hours=JOB_CLEANUP_HOURS)
        jobs_to_remove = [
            job_id for job_id, job in jobs.items() 
            if job.created_at < cutoff_time
        ]
        
        for job_id in jobs_to_remove:
            del jobs[job_id]
            logging.info(f"Cleaned up old job: {job_id}")
        
        # Also limit total jobs in memory
        if len(jobs) > MAX_JOBS_IN_MEMORY:
            oldest_jobs = sorted(jobs.items(), key=lambda x: x[1].created_at)
            jobs_to_remove = oldest_jobs[:len(jobs) - MAX_JOBS_IN_MEMORY]
            for job_id, _ in jobs_to_remove:
                del jobs[job_id]
                logging.info(f"Cleaned up job due to memory limit: {job_id}")
                
        logging.info(f"Job cleanup completed. Active jobs: {len(jobs)}")
    except Exception as e:
        logging.error(f"Error during job cleanup: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)