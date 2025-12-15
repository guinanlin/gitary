"""
调试脚本：测试 GitCode API 调用
"""
import asyncio
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

# 加载环境变量
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# 设置详细日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

from image_2_scripts.gitcode_model_adapter import GitCodeModelAdapter
from google.genai.types import Content, Part
from google.adk.models.llm_request import LlmRequest
from google.genai import types

async def test_simple_text():
    """测试简单文本消息"""
    print("=" * 60)
    print("测试 1: 简单文本消息")
    print("=" * 60)
    
    adapter = GitCodeModelAdapter(
        model="deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=os.getenv("GITCODE_API_KEY"),
    )
    
    content = Content(
        role="user",
        parts=[Part(text="hello")]
    )
    
    config = types.GenerateContentConfig(
        max_output_tokens=1024,
        temperature=0.7,
    )
    
    llm_request = LlmRequest(
        contents=[content],
        config=config,
    )
    
    print(f"\n发送消息: {content.parts[0].text}")
    print(f"API Key: {adapter._api_key[:10]}...")
    print(f"API URL: {adapter._api_url}")
    
    try:
        responses = []
        async for response in adapter.generate_content_async(llm_request, stream=False):
            responses.append(response)
            print(f"\n收到响应:")
            print(f"  - Model Version: {response.model_version}")
            print(f"  - Partial: {response.partial}")
            print(f"  - Content: {response.content.parts[0].text if response.content.parts else 'No parts'}")
        
        if responses:
            final_response = responses[-1]
            print(f"\n最终响应内容: {final_response.content.parts[0].text if final_response.content.parts else 'Empty'}")
        else:
            print("\n❌ 没有收到任何响应")
            
    except Exception as e:
        print(f"\n❌ 错误: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

async def test_with_image_url():
    """测试带图片 URL 的消息"""
    print("\n" + "=" * 60)
    print("测试 2: 带图片 URL 的消息")
    print("=" * 60)
    
    adapter = GitCodeModelAdapter(
        model="deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=os.getenv("GITCODE_API_KEY"),
    )
    
    content = Content(
        role="user",
        parts=[
            Part(text="https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg"),
            Part(text="用一句话描述这张图片")
        ]
    )
    
    config = types.GenerateContentConfig(
        max_output_tokens=1024,
        temperature=0.7,
    )
    
    llm_request = LlmRequest(
        contents=[content],
        config=config,
    )
    
    print(f"\n发送消息:")
    print(f"  - 图片 URL: {content.parts[0].text}")
    print(f"  - 文本: {content.parts[1].text}")
    
    try:
        responses = []
        async for response in adapter.generate_content_async(llm_request, stream=False):
            responses.append(response)
            print(f"\n收到响应:")
            print(f"  - Model Version: {response.model_version}")
            print(f"  - Partial: {response.partial}")
            print(f"  - Content: {response.content.parts[0].text[:100] if response.content.parts else 'No parts'}...")
        
        if responses:
            final_response = responses[-1]
            print(f"\n最终响应内容: {final_response.content.parts[0].text if final_response.content.parts else 'Empty'}")
        else:
            print("\n❌ 没有收到任何响应")
            
    except Exception as e:
        print(f"\n❌ 错误: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """主函数"""
    print("\n开始调试测试...\n")
    
    # 测试 1: 简单文本
    await test_simple_text()
    
    # 测试 2: 带图片 URL
    # await test_with_image_url()
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
