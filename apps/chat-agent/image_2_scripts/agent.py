from __future__ import annotations
from google.adk.agents import Agent
import os
from pathlib import Path
from dotenv import load_dotenv
from .gitcode_model_adapter import GitCodeModelAdapter

# 加载环境变量（从项目根目录的 .env 文件）
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# 获取 API Key，优先使用环境变量
gitcode_api_key = os.getenv("GITCODE_API_KEY", "ZjuVRwW1DQxssBQfLwAb7Qmr")

root_agent = Agent(
    name="image_2_scripts",
    model=GitCodeModelAdapter(
        model="deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=gitcode_api_key,
    ),
    description="图片转脚本智能体，支持图片和文本输入",
    instruction=(
        "你是一个专业的图片转脚本智能体。"
        "当用户提供图片时，你需要仔细分析图片内容，并根据用户的要求生成相应的脚本或代码。"
        "支持多种图片格式，包括截图、设计稿、流程图等。"
        "生成的脚本应该清晰、完整、可直接使用。"
        "如果图片中包含代码，请准确提取并格式化。"
        "如果图片是设计稿或流程图，请根据内容生成相应的实现代码。"
    ),
    tools=[],
)
