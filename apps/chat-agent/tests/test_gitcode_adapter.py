"""
测试 GitCode 模型适配器
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from image_2_scripts.gitcode_model_adapter import GitCodeModelAdapter
from google.genai.types import Content, Part

print("=" * 60)
print("测试 GitCode 模型适配器")
print("=" * 60)

model = GitCodeModelAdapter(
    model="deepseek-ai/deepseek-vl2",
    api_base="https://api.gitcode.com/api/v5",
    api_key="ZjuVRwW1DQxssBQfLwAb7Qmr",
)

print("\n测试简单文本消息...")
try:
    contents = [
        Content(
            role="user",
            parts=[Part(text="你好，这是一条测试消息")]
        )
    ]
    
    response = model.generate_content(contents)
    
    print("✅ 成功!")
    print(f"响应: {response.candidates[0].content.parts[0].text}")
except Exception as e:
    print(f"❌ 失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
