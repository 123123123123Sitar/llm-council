# Fallback mechanism if FastAPI itself is missing
try:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
except ImportError:
    # If FastAPI is missing, we need a raw ASGI app to report it
    async def app(scope, receive, send):
        await send({
            'type': 'http.response.start',
            'status': 500,
            'headers': [
                [b'content-type', b'application/json'],
            ],
        })
        error_msg = f"CRITICAL: FastAPI not found.\nPython: {sys.version}\nPath: {sys.path}"
        await send({
            'type': 'http.response.body',
            'body': json.dumps({"detail": error_msg}).encode('utf-8'),
        })

import traceback
import sys
import os
import json

# Ensure the root directory is in sys.path so we can import backend
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Check if app is already defined by the fallback above
if 'app' not in locals() or isinstance(app, type): # Check if it's the class or instance
     try:
        from backend.main import app
     except BaseException as exc:
        # If backend import fails, create a fallback app
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse
        app = FastAPI()
        
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
