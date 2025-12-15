"""
测试禁用流式响应的配置
"""
import os
import litellm
from dotenv import load_dotenv
from pathlib import Path

# 加载环境变量
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

api_key = os.getenv("GITCODE_API_KEY", "ZjuVRwW1DQxssBQfLwAb7Qmr")

print("=" * 60)
print("测试禁用流式响应")
print("=" * 60)

# 测试：使用 openai/ 前缀，禁用流式响应
print("\n测试: openai/ 前缀，stream=False")
try:
    response = litellm.completion(
        model="openai/deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=api_key,
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=50,
        stream=False,  # 禁用流式响应
    )
    print("✅ 成功!")
    print(f"响应: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ 失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
