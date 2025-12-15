"""
GitCode API 适配器 - 处理流式响应
使用 LiteLLM 的流式处理功能
"""
from __future__ import annotations
import os
import litellm
from typing import Optional
from google.adk.models.lite_llm import LiteLlm


class GitCodeLiteLlm(LiteLlm):
    """GitCode API 的 LiteLLM 适配器，处理流式响应"""
    
    def __init__(
        self,
        model: str = "deepseek-ai/deepseek-vl2",
        api_base: str = "https://api.gitcode.com/api/v5",
        api_key: Optional[str] = None,
    ):
        # GitCode API 使用 openai/ 前缀，但需要特殊处理流式响应
        super().__init__(
            model=f"openai/{model}",
            api_base=api_base,
            api_key=api_key or os.getenv("GITCODE_API_KEY", ""),
        )
        
        # 设置 LiteLLM 处理流式响应
        litellm.drop_params = True
        litellm.suppress_debug_info = True
