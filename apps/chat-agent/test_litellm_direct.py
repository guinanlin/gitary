"""
直接测试 LiteLLM 配置，看看正确的 URL 构建方式
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
print("测试 LiteLLM 配置")
print("=" * 60)

# 测试 1: 使用 custom/ 前缀
print("\n测试 1: custom/ 前缀，api_base 不包含路径")
try:
    response = litellm.completion(
        model="custom/deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=api_key,
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10,
    )
    print("✅ 成功!")
    print(f"响应: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ 失败: {e}")

# 测试 2: 使用 openai/ 前缀
print("\n测试 2: openai/ 前缀，api_base 不包含路径")
try:
    response = litellm.completion(
        model="openai/deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5",
        api_key=api_key,
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10,
    )
    print("✅ 成功!")
    print(f"响应: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ 失败: {e}")

# 测试 3: 使用 custom/ 前缀，api_base 包含完整路径
print("\n测试 3: custom/ 前缀，api_base 包含完整路径")
try:
    response = litellm.completion(
        model="custom/deepseek-ai/deepseek-vl2",
        api_base="https://api.gitcode.com/api/v5/chat/completions",
        api_key=api_key,
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10,
    )
    print("✅ 成功!")
    print(f"响应: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ 失败: {e}")

print("\n" + "=" * 60)
