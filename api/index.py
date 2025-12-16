from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
import sys
import os

# Ensure the root directory is in sys.path so we can import backend
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from backend.main import app
except BaseException as exc:
    # If import fails, create a fallback app to report the error
    app = FastAPI()
    
    import sys
    import os
    
    # Gather diagnostic info
    cwd_files = []
    for root, dirs, files in os.walk("."):
        for f in files:
            cwd_files.append(os.path.join(root, f))
            if len(cwd_files) > 50: break
    
    error_msg = f"""Startup Error: {type(exc).__name__}: {str(exc)}
    
Python: {sys.version}
CWD: {os.getcwd()}
Path: {sys.path}
Files: {cwd_files}

Traceback:
{traceback.format_exc()}"""
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all(path_name: str):
        return JSONResponse(
            status_code=500,
            content={"detail": error_msg}
        )
