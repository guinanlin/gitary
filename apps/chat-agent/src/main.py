from fastapi import FastAPI
from pathlib import Path
import uvicorn
import os
from .api.middleware import setup_middleware
from .api.routes import setup_routes

app = FastAPI(
    title="Dty Chat Agent API",
    description="FastAPI server with Google ADK integration",
    version="1.0.0"
)

agents_dir = Path(__file__).parent / "agents"

setup_middleware(app)
setup_routes(app, agents_dir)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8234))
    uvicorn.run(app, host="0.0.0.0", port=port)


