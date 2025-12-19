from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from google.adk.cli.fast_api import get_fast_api_app
from pathlib import Path
import json
import asyncio
from .models import RunAgentRequest

def setup_routes(app: FastAPI, agents_dir: Path):
    adk_app = get_fast_api_app(
        agents_dir=str(agents_dir),
        web=False,
        allow_origins=["*"],
    )

    @app.get("/")
    async def root():
        return {
            "message": "Gitary Chat Agent API",
            "status": "running",
            "adk_endpoints": "/adk",
            "docs": "/docs"
        }

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "chat-agent"}

    @app.get("/adk/apps")
    async def list_apps(request: Request):
        try:
            scope = {
                "type": "http",
                "method": "GET",
                "path": "/",
                "raw_path": b"/",
                "root_path": "",
                "scheme": "http",
                "query_string": b"",
                "headers": [(k.encode(), v.encode()) for k, v in request.headers.items()],
                "client": request.client.host if request.client else ("127.0.0.1", 0),
                "server": ("testserver", 80),
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "http_version": "1.1",
            }
            
            received = False
            
            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": b"", "more_body": False}
                return {"type": "http.disconnect"}
            
            status = None
            headers = []
            body_chunks = []
            
            async def send(message):
                nonlocal status, headers
                if message["type"] == "http.response.start":
                    status = message["status"]
                    headers = message["headers"]
                elif message["type"] == "http.response.body":
                    body_chunks.append(message.get("body", b""))
            
            await adk_app(scope, receive, send)
            
            if status == 200:
                content = b"".join(body_chunks)
                return JSONResponse(content=json.loads(content.decode()) if content else {})
        except Exception:
            pass
        
        agents_parent_dir = agents_dir
        apps = []
        
        def scan_agents(directory: Path):
            for item in directory.iterdir():
                if not item.is_dir():
                    continue
                if item.name.startswith('.') or item.name.startswith('__'):
                    continue
                if (item / "agent.py").exists() or (item / "root_agent.yaml").exists():
                    apps.append(item.name)
                else:
                    scan_agents(item)
        
        scan_agents(agents_parent_dir)
        
        return {
            "apps": sorted(apps),
            "agents_dir": str(agents_parent_dir)
        }

    @app.post("/adk/apps/{app_name}/users/{user_id}/sessions")
    async def create_session(app_name: str, user_id: str, request: Request):
        try:
            scope = {
                "type": "http",
                "method": "POST",
                "path": f"/apps/{app_name}/users/{user_id}/sessions",
                "raw_path": f"/apps/{app_name}/users/{user_id}/sessions".encode(),
                "root_path": "",
                "scheme": "http",
                "query_string": b"",
                "headers": [(k.encode(), v.encode()) for k, v in request.headers.items()],
                "client": request.client.host if request.client else ("127.0.0.1", 0),
                "server": ("testserver", 80),
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "http_version": "1.1",
            }
            
            body = await request.body()
            received = False
            
            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return {"type": "http.disconnect"}
            
            status = None
            headers = []
            body_chunks = []
            
            async def send(message):
                nonlocal status, headers
                if message["type"] == "http.response.start":
                    status = message["status"]
                    headers = message["headers"]
                elif message["type"] == "http.response.body":
                    body_chunks.append(message.get("body", b""))
            
            await adk_app(scope, receive, send)
            
            if status and status in [200, 201]:
                content = b"".join(body_chunks)
                return JSONResponse(content=json.loads(content.decode()) if content else {})
            else:
                error_detail = b"".join(body_chunks).decode() if body_chunks else f"ADK returned status {status}"
                raise HTTPException(status_code=status or 500, detail=error_detail)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

    @app.get("/adk/apps/{app_name}/users/{user_id}/sessions")
    async def list_sessions(app_name: str, user_id: str, request: Request):
        try:
            scope = {
                "type": "http",
                "method": "GET",
                "path": f"/apps/{app_name}/users/{user_id}/sessions",
                "raw_path": f"/apps/{app_name}/users/{user_id}/sessions".encode(),
                "root_path": "",
                "scheme": "http",
                "query_string": b"",
                "headers": [(k.encode(), v.encode()) for k, v in request.headers.items()],
                "client": request.client.host if request.client else ("127.0.0.1", 0),
                "server": ("testserver", 80),
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "http_version": "1.1",
            }
            
            received = False
            
            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": b"", "more_body": False}
                return {"type": "http.disconnect"}
            
            status = None
            headers = []
            body_chunks = []
            
            async def send(message):
                nonlocal status, headers
                if message["type"] == "http.response.start":
                    status = message["status"]
                    headers = message["headers"]
                elif message["type"] == "http.response.body":
                    body_chunks.append(message.get("body", b""))
            
            await adk_app(scope, receive, send)
            
            if status == 200:
                content = b"".join(body_chunks)
                return JSONResponse(content=json.loads(content.decode()) if content else {})
            else:
                error_detail = b"".join(body_chunks).decode() if body_chunks else f"ADK returned status {status}"
                raise HTTPException(status_code=status or 500, detail=error_detail)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error listing sessions: {str(e)}")

    @app.post("/adk/run")
    async def run_agent(request_model: RunAgentRequest):
        try:
            request_body = {
                "app_name": request_model.app_name,
                "user_id": request_model.user_id,
                "session_id": request_model.session_id,
                "new_message": request_model.new_message.model_dump()
            }
            body_bytes = json.dumps(request_body).encode()
            
            scope = {
                "type": "http",
                "method": "POST",
                "path": "/run",
                "raw_path": b"/run",
                "root_path": "",
                "scheme": "http",
                "query_string": b"",
                "headers": [(b"content-type", b"application/json")],
                "client": ("127.0.0.1", 0),
                "server": ("testserver", 80),
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "http_version": "1.1",
            }
            
            received = False
            
            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": body_bytes, "more_body": False}
                return {"type": "http.disconnect"}
            
            status = None
            headers = []
            body_chunks = []
            
            async def send(message):
                nonlocal status, headers
                if message["type"] == "http.response.start":
                    status = message["status"]
                    headers = message["headers"]
                elif message["type"] == "http.response.body":
                    body_chunks.append(message.get("body", b""))
            
            await adk_app(scope, receive, send)
            
            if status == 200:
                content = b"".join(body_chunks)
                return JSONResponse(content=json.loads(content.decode()) if content else {})
            else:
                error_detail = b"".join(body_chunks).decode() if body_chunks else f"ADK returned status {status}"
                raise HTTPException(status_code=status or 500, detail=error_detail)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error running agent: {str(e)}")

    @app.post("/adk/run_sse")
    async def run_agent_sse(request_model: RunAgentRequest):
        try:
            request_body = {
                "app_name": request_model.app_name,
                "user_id": request_model.user_id,
                "session_id": request_model.session_id,
                "new_message": request_model.new_message.model_dump()
            }
            body_bytes = json.dumps(request_body).encode()
            
            scope = {
                "type": "http",
                "method": "POST",
                "path": "/run_sse",
                "raw_path": b"/run_sse",
                "root_path": "",
                "scheme": "http",
                "query_string": b"",
                "headers": [(b"content-type", b"application/json")],
                "client": ("127.0.0.1", 0),
                "server": ("testserver", 80),
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "http_version": "1.1",
            }
            
            received = False
            
            async def receive():
                nonlocal received
                if not received:
                    received = True
                    return {"type": "http.request", "body": body_bytes, "more_body": False}
                return {"type": "http.disconnect"}
            
            queue = asyncio.Queue()
            status = None
            headers = []
            complete = False
            
            async def send(message):
                nonlocal status, headers, complete
                if message["type"] == "http.response.start":
                    status = message["status"]
                    headers = message["headers"]
                elif message["type"] == "http.response.body":
                    body = message.get("body", b"")
                    more_body = message.get("more_body", False)
                    await queue.put(body)
                    if not more_body:
                        await queue.put(None)
                        complete = True
            
            async def generate():
                task = asyncio.create_task(adk_app(scope, receive, send))
                try:
                    while True:
                        chunk = await queue.get()
                        if chunk is None:
                            break
                        yield chunk
                finally:
                    if not task.done():
                        task.cancel()
                        try:
                            await task
                        except asyncio.CancelledError:
                            pass
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error running agent stream: {str(e)}")

    app.mount("/adk", adk_app)


