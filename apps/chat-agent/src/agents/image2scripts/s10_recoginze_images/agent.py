from __future__ import annotations
from google.adk.agents import Agent
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))
from src.adapters.gitcode_model_adapter import GitCodeModelAdapter
from src.tools.json_formatter import format_image_results_json
from src.utils.file_loader import load_instructions_file
from .tools.ppt_processor import process_ppt_pages
from .tools.format_ppt_results_json import format_ppt_results_json

# 加载环境变量（从项目根目录的 .env 文件）
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# 获取 API Key，优先使用环境变量
gitcode_api_key = os.getenv("GITCODE_API_KEY", "ZjuVRwW1DQxssBQfLwAb7Qmr")

agent_dir = Path(__file__).parent
root_agent = Agent(
    name="s10_recoginze_images",
    model=GitCodeModelAdapter(
        model="deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=gitcode_api_key,
    ),
    description=load_instructions_file(f"{agent_dir}/description.txt"),
    instruction=load_instructions_file(f"{agent_dir}/instructions.txt"),
    tools=[process_ppt_pages, format_ppt_results_json, format_image_results_json],
)
