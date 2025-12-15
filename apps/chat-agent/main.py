from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from google.adk.cli.fast_api import get_fast_api_app
import uvicorn
import os
from pathlib import Path
from pydantic import BaseModel
from typing import List
import json

app = FastAPI(
    title="Gitary Chat Agent API",
    description="FastAPI server with Google ADK integration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求验证错误，返回详细的错误信息"""
    return JSONResponse(
        status_code=422,
        content={
            "detail": "There was an error parsing the body",
            "errors": exc.errors(),
            "body": str(exc.body) if hasattr(exc, 'body') else None
        }
    )

agents_dir = Path(__file__).parent

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

class MessagePart(BaseModel):
    text: str

class NewMessage(BaseModel):
    role: str
    parts: List[MessagePart]

class RunAgentRequest(BaseModel):
    app_name: str
    user_id: str
    session_id: str
    new_message: NewMessage

@app.get("/adk/apps")
async def list_apps(request: Request):
    """列出可用的应用"""
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
    
    # 扫描智能体目录，查找所有有效的智能体
    agents_parent_dir = Path(__file__).parent
    apps = []
    
    for item in agents_parent_dir.iterdir():
        if not item.is_dir():
            continue
        # 跳过隐藏目录和特殊目录
        if item.name.startswith('.') or item.name.startswith('__'):
            continue
        # 检查是否是有效的智能体目录（包含 agent.py 或 root_agent.yaml）
        if (item / "agent.py").exists() or (item / "root_agent.yaml").exists():
            apps.append(item.name)
    
    return {
        "apps": sorted(apps),
        "agents_dir": str(agents_parent_dir)
    }

@app.post("/adk/apps/{app_name}/users/{user_id}/sessions")
async def create_session(app_name: str, user_id: str, request: Request):
    """创建新的会话"""
    from starlette.requests import Request as StarletteRequest
    from starlette.responses import Response as StarletteResponse
    
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
    """列出用户的所有会话"""
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
    """同步运行 Agent（等待完整响应）"""
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
    """流式运行 Agent（Server-Sent Events，实时返回）"""
    import asyncio
    
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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8234))
    uvicorn.run(app, host="0.0.0.0", port=port)
