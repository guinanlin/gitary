"""
GitCode API 模型适配器
继承自 BaseLlm 以兼容 ADK，但完全不使用 LiteLLM，直接调用 GitCode API
"""
from __future__ import annotations
import os
import json
import requests
from typing import Optional, List, AsyncIterator, AsyncGenerator
from google.adk.models.base_llm import BaseLlm
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types
from google.genai.types import GenerateContentResponse, Content, Part, Candidate


class GitCodeModelAdapter(BaseLlm):
    """GitCode API 模型适配器，直接处理 GitCode API，不依赖 LiteLLM"""
    
    def __init__(
        self,
        model: str = "deepseek-ai/deepseek-vl2",
        api_base: str = "https://api.gitcode.com/api/v5",
        api_key: Optional[str] = None,
    ):
        # 调用父类初始化，传入 model 字段（BaseLlm 是 Pydantic 模型，需要 model 字段）
        super().__init__(model=model)
        
        # 保存 GitCode API 配置（这些不是 Pydantic 字段，使用私有属性）
        object.__setattr__(self, '_gitcode_model', model)
        object.__setattr__(self, '_api_base', api_base.rstrip("/"))
        object.__setattr__(self, '_api_key', api_key or os.getenv("GITCODE_API_KEY", ""))
        object.__setattr__(self, '_api_url', f"{api_base.rstrip('/')}/chat/completions")
    
    def _convert_content_to_messages(self, contents: List[Content]) -> List[dict]:
        """将 ADK 的 Content 格式转换为 GitCode API 的 messages 格式
        
        支持两种图片格式：
        1. base64 编码（inline_data）
        2. HTTP/HTTPS URL（file_data 或通过 text 字段传递的 URL）
        """
        import logging
        logger = logging.getLogger(__name__)
        
        messages = []
        
        for content in contents:
            role = "user" if content.role == "user" else "assistant"
            parts_content = []
            
            logger.debug(f"Processing content with role: {role}, parts count: {len(content.parts)}")
            
            for part in content.parts:
                if hasattr(part, "text") and part.text:
                    text = part.text
                    logger.debug(f"Found text part: {text[:50]}...")
                    if text.startswith(("http://", "https://")):
                        parts_content.append({
                            "type": "image_url",
                            "image_url": {
                                "url": text
                            }
                        })
                        logger.debug(f"Added image URL: {text}")
                    else:
                        parts_content.append({
                            "type": "text",
                            "text": text
                        })
                        logger.debug(f"Added text: {text[:50]}...")
                elif hasattr(part, "inline_data") and part.inline_data:
                    parts_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{part.inline_data.mime_type};base64,{part.inline_data.data[:50]}..."
                        }
                    })
                    logger.debug(f"Added inline_data image with mime_type: {part.inline_data.mime_type}")
                elif hasattr(part, "file_data") and part.file_data:
                    file_data = part.file_data
                    if hasattr(file_data, "file_uri") and file_data.file_uri:
                        parts_content.append({
                            "type": "image_url",
                            "image_url": {
                                "url": file_data.file_uri
                            }
                        })
                        logger.debug(f"Added file_data image with URI: {file_data.file_uri}")
            
            if parts_content:
                if len(parts_content) == 1 and parts_content[0]["type"] == "text":
                    message = {
                        "role": role,
                        "content": parts_content[0]["text"]
                    }
                    logger.debug(f"Created simple text message: {message}")
                    messages.append(message)
                else:
                    message = {
                        "role": role,
                        "content": parts_content
                    }
                    logger.debug(f"Created multi-part message with {len(parts_content)} parts")
                    messages.append(message)
            else:
                logger.warning(f"No parts_content created for content with role: {role}")
        
        logger.info(f"Converted {len(contents)} contents to {len(messages)} messages")
        return messages
    
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
            except (json.JSONDecodeError, KeyError):
                continue
        
        return full_content
    
    def generate_content(
        self,
        contents: List[Content],
        config: Optional[types.GenerateContentConfig] = None,
    ) -> GenerateContentResponse:
        """生成内容（同步）"""
        messages = self._convert_content_to_messages(contents)
        
        max_tokens = 1024
        if config:
            max_output_tokens = getattr(config, "max_output_tokens", None)
            if max_output_tokens is not None:
                max_tokens = max_output_tokens
        
        temperature = 0.7
        if config:
            temp = getattr(config, "temperature", None)
            if temp is not None:
                temperature = temp
        
        payload = {
            "model": self._gitcode_model,
            "messages": messages,
            "stream": True,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0,
        }
        
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        
        response = requests.post(
            self._api_url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=60,
        )
        
        response.raise_for_status()
        
        full_content = self._parse_stream_response(response)
        
        return GenerateContentResponse(
            candidates=[
                Candidate(
                    content=Content(
                        role="model",
                        parts=[Part(text=full_content)]
                    ),
                    finish_reason="STOP",
                )
            ]
        )
    
    async def generate_content_async(
        self,
        llm_request: LlmRequest,
        stream: bool = False,
    ) -> AsyncGenerator[LlmResponse, None]:
        """生成内容（异步）"""
        try:
            import aiohttp
            
            if not hasattr(aiohttp, 'ClientSession'):
                raise AttributeError("aiohttp module does not have ClientSession attribute. This may indicate a corrupted installation or version incompatibility.")
            
        except ImportError:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("aiohttp is not installed. Please install it with: pip install aiohttp")
            yield LlmResponse(
                content=Content(
                    role="model",
                    parts=[Part(text="Error: aiohttp is not installed. Please install it with: pip install aiohttp")]
                ),
                partial=False,
                model_version=self._gitcode_model,
            )
            return
        except AttributeError as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"aiohttp module error: {e}. Please reinstall aiohttp: pip install --upgrade --force-reinstall aiohttp")
            yield LlmResponse(
                content=Content(
                    role="model",
                    parts=[Part(text=f"Error: aiohttp module error: {e}. Please reinstall aiohttp: pip install --upgrade --force-reinstall aiohttp")]
                ),
                partial=False,
                model_version=self._gitcode_model,
            )
            return
        
        import logging
        
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info(f"generate_content_async called with stream={stream}")
        
        contents = llm_request.contents or []
        config = llm_request.config
        
        messages = self._convert_content_to_messages(contents)
        
        max_tokens = 1024
        if config:
            max_output_tokens = getattr(config, "max_output_tokens", None)
            if max_output_tokens is not None:
                max_tokens = max_output_tokens
        
        temperature = 0.7
        if config:
            temp = getattr(config, "temperature", None)
            if temp is not None:
                temperature = temp
        
        payload = {
            "model": self._gitcode_model,
            "messages": messages,
            "stream": stream,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0,
        }
        
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        
        try:
            logger.info(f"Calling GitCode API: {self._api_url}")
            logger.info(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
            logger.info(f"Messages: {json.dumps(messages, ensure_ascii=False, indent=2)}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self._api_url,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as response:
                    logger.info(f"GitCode API response status: {response.status}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"GitCode API error: {response.status} - {error_text}")
                        yield LlmResponse(
                            content=Content(
                                role="model",
                                parts=[Part(text=f"API Error: {response.status} - {error_text}")]
                            ),
                            partial=False,
                            model_version=self._gitcode_model,
                        )
                        return
                    
                    response.raise_for_status()
                    
                    if stream:
                        full_content = ""
                        buffer = b""
                        
                        async for chunk in response.content.iter_any():
                            if not chunk:
                                break
                            
                            buffer += chunk
                            
                            while b"\n" in buffer:
                                line, buffer = buffer.split(b"\n", 1)
                                line_str = line.decode("utf-8", errors="ignore").strip()
                                
                                if not line_str:
                                    continue
                                
                                if not line_str.startswith("data:"):
                                    continue
                                
                                if line_str.strip() == "data:[DONE]":
                                    if full_content:
                                        yield LlmResponse(
                                            content=Content(
                                                role="model",
                                                parts=[Part(text=full_content)]
                                            ),
                                            partial=False,
                                            model_version=self._gitcode_model,
                                        )
                                    return
                                
                                try:
                                    data_str = line_str.lstrip("data:").strip()
                                    if not data_str:
                                        continue
                                    
                                    data = json.loads(data_str)
                                    
                                    if "choices" in data and len(data["choices"]) > 0:
                                        delta = data["choices"][0].get("delta", {})
                                        content_chunk = delta.get("content", "")
                                        if content_chunk:
                                            full_content += content_chunk
                                            yield LlmResponse(
                                                content=Content(
                                                    role="model",
                                                    parts=[Part(text=content_chunk)]
                                                ),
                                                partial=True,
                                                model_version=self._gitcode_model,
                                            )
                                except (json.JSONDecodeError, KeyError) as e:
                                    logger.debug(f"Failed to parse chunk: {e}")
                                    continue
                        
                        if full_content:
                            yield LlmResponse(
                                content=Content(
                                    role="model",
                                    parts=[Part(text=full_content)]
                                ),
                                partial=False,
                                model_version=self._gitcode_model,
                            )
                    else:
                        response_text = await response.text()
                        logger.info(f"GitCode API response body: {response_text[:500]}...")  # 只记录前500字符
                        
                        try:
                            response_json = json.loads(response_text)
                            logger.info(f"Parsed response JSON keys: {list(response_json.keys())}")
                            
                            if "error_code" in response_json or "error" in response_json:
                                error_code = response_json.get("error_code", response_json.get("error", {}).get("code", "unknown"))
                                error_message = response_json.get("error_message", response_json.get("error", {}).get("message", "Unknown error"))
                                error_name = response_json.get("error_code_name", "")
                                trace_id = response_json.get("trace_id", "")
                                
                                logger.error(f"GitCode API error: {error_code} ({error_name}) - {error_message} (trace_id: {trace_id})")
                                yield LlmResponse(
                                    content=Content(
                                        role="model",
                                        parts=[Part(text=f"[API错误 {error_code}: {error_message}]")]
                                    ),
                                    partial=False,
                                    model_version=self._gitcode_model,
                                )
                                return
                            
                            if "choices" in response_json and len(response_json["choices"]) > 0:
                                choice = response_json["choices"][0]
                                logger.info(f"Choice keys: {list(choice.keys())}")
                                
                                message = choice.get("message", {})
                                logger.info(f"Message keys: {list(message.keys()) if isinstance(message, dict) else 'not a dict'}")
                                
                                content_text = message.get("content", "") if isinstance(message, dict) else ""
                                
                                if not content_text:
                                    logger.warning(f"Empty content in response. Full response: {json.dumps(response_json, ensure_ascii=False, indent=2)}")
                                    content_text = f"[API返回空内容，请检查日志。Response: {json.dumps(response_json, ensure_ascii=False)}]"
                                
                                logger.info(f"Extracted content length: {len(content_text)}")
                                
                                yield LlmResponse(
                                    content=Content(
                                        role="model",
                                        parts=[Part(text=content_text)]
                                    ),
                                    partial=False,
                                    model_version=self._gitcode_model,
                                )
                            else:
                                logger.error(f"No choices in response. Full response: {json.dumps(response_json, ensure_ascii=False, indent=2)}")
                                yield LlmResponse(
                                    content=Content(
                                        role="model",
                                        parts=[Part(text=f"[API响应格式错误，无choices字段。Response: {json.dumps(response_json, ensure_ascii=False)}]")]
                                    ),
                                    partial=False,
                                    model_version=self._gitcode_model,
                                )
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse JSON response: {e}. Response text: {response_text[:500]}")
                            yield LlmResponse(
                                content=Content(
                                    role="model",
                                    parts=[Part(text=f"[API响应解析失败: {str(e)}]")]
                                ),
                                partial=False,
                                model_version=self._gitcode_model,
                            )
        except AttributeError as e:
            if "aiohttp" in str(e) or "ClientSession" in str(e) or "ClientError" in str(e):
                logger.error(f"aiohttp import or usage error: {e}. Please check if aiohttp is correctly installed.", exc_info=True)
                yield LlmResponse(
                    content=Content(
                        role="model",
                        parts=[Part(text=f"aiohttp error: {str(e)}. Please reinstall aiohttp: pip install --upgrade --force-reinstall aiohttp")]
                    ),
                    partial=False,
                    model_version=self._gitcode_model,
                )
            else:
                raise
        except (aiohttp.ClientResponseError, aiohttp.ClientConnectionError) as e:
            logger.error(f"GitCode API network error: {e}", exc_info=True)
            yield LlmResponse(
                content=Content(
                    role="model",
                    parts=[Part(text=f"Network error: {str(e)}")]
                ),
                partial=False,
                model_version=self._gitcode_model,
            )
        except Exception as e:
            logger.error(f"GitCode API request failed: {type(e).__name__}: {e}", exc_info=True)
            yield LlmResponse(
                content=Content(
                    role="model",
                    parts=[Part(text=f"Request failed: {type(e).__name__}: {str(e)}")]
                ),
                partial=False,
                model_version=self._gitcode_model,
            )
