from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback

try:
    from backend.main import app
except Exception as exc:
    # If import fails, create a fallback app to report the error
    app = FastAPI()
    
    error_msg = f"Startup Error: {type(exc).__name__}: {str(exc)}\n\n{traceback.format_exc()}"
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all(path_name: str):
        return JSONResponse(
            status_code=500,
            content={"detail": error_msg}
        )
