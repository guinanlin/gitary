"""
GitCode API 自定义模型包装类
处理 GitCode API 的流式响应格式
"""
from __future__ import annotations
import os
import json
import requests
from typing import Any, Dict, List, Optional, AsyncIterator, Iterator
from google.genai import types
from google.genai.types import GenerateContentResponse, Content, Part


class GitCodeModel:
    """GitCode API 模型包装类，处理流式响应"""
    
    def __init__(
        self,
        model: str = "deepseek-ai/deepseek-vl2",
        api_base: str = "https://api.gitcode.com/api/v5",
        api_key: Optional[str] = None,
    ):
        self.model = model
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key or os.getenv("GITCODE_API_KEY", "")
        self.api_url = f"{self.api_base}/chat/completions"
    
    def _parse_stream_response(self, response: requests.Response) -> str:
        """解析 GitCode API 的流式响应（SSE 格式）"""
        full_content = ""
        
        for line in response.iter_lines():
            if not line:
                continue
            
            line_str = line.decode("utf-8")
            
            if not line_str.startswith("data:"):
                continue
            
            if line_str.strip() == "data:[DONE]":
                break
            
            try:
                data_str = line_str.lstrip("data:").strip()
                if not data_str:
                    continue
                
                data = json.loads(data_str)
                
                if "choices" in data and len(data["choices"]) > 0:
                    delta = data["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        full_content += content
            except (json.JSONDecodeError, KeyError) as e:
                continue
        
        return full_content
    
    def generate_content(
        self,
        contents: List[Content],
        config: Optional[types.GenerateContentConfig] = None,
    ) -> GenerateContentResponse:
        """生成内容（同步）"""
        messages = []
        
        for content in contents:
            role = "user" if content.role == "user" else "assistant"
            parts_content = []
            
            for part in content.parts:
                if hasattr(part, "text") and part.text:
                    parts_content.append({
                        "type": "text",
                        "text": part.text
                    })
                elif hasattr(part, "inline_data") and part.inline_data:
                    parts_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{part.inline_data.mime_type};base64,{part.inline_data.data}"
                        }
                    })
            
            if parts_content:
                messages.append({
                    "role": role,
                    "content": parts_content if len(parts_content) > 1 else parts_content[0]["text"]
                })
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "max_tokens": getattr(config, "max_output_tokens", None) or 1024,
            "temperature": getattr(config, "temperature", None) or 0.7,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0,
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=60,
        )
        
        response.raise_for_status()
        
        full_content = self._parse_stream_response(response)
        
        return GenerateContentResponse(
            candidates=[
                types.Candidate(
                    content=Content(
                        role="model",
                        parts=[types.Part(text=full_content)]
                    ),
                    finish_reason="STOP",
                )
            ]
        )
    
    async def generate_content_async(
        self,
        contents: List[Content],
        config: Optional[types.GenerateContentConfig] = None,
    ) -> AsyncIterator[GenerateContentResponse]:
        """生成内容（异步流式）"""
        import aiohttp
        
        messages = []
        
        for content in contents:
            role = "user" if content.role == "user" else "assistant"
            parts_content = []
            
            for part in content.parts:
                if hasattr(part, "text") and part.text:
                    parts_content.append({
                        "type": "text",
                        "text": part.text
                    })
                elif hasattr(part, "inline_data") and part.inline_data:
                    parts_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{part.inline_data.mime_type};base64,{part.inline_data.data}"
                        }
                    })
            
            if parts_content:
                messages.append({
                    "role": role,
                    "content": parts_content if len(parts_content) > 1 else parts_content[0]["text"]
                })
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "max_tokens": getattr(config, "max_output_tokens", None) or 1024,
            "temperature": getattr(config, "temperature", None) or 0.7,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0,
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.api_url,
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                
                async for line in response.content:
                    line_str = line.decode("utf-8")
                    
                    if not line_str.startswith("data:"):
                        continue
                    
                    if line_str.strip() == "data:[DONE]":
                        break
                    
                    try:
                        data_str = line_str.lstrip("data:").strip()
                        if not data_str:
                            continue
                        
                        data = json.loads(data_str)
                        
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield GenerateContentResponse(
                                    candidates=[
                                        types.Candidate(
                                            content=Content(
                                                role="model",
                                                parts=[types.Part(text=content)]
                                            ),
                                        )
                                    ]
                                )
                    except (json.JSONDecodeError, KeyError):
                        continue
