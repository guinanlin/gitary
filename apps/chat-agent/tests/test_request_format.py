"""
测试请求格式
"""
import requests
import json

url = "http://127.0.0.1:8234/adk/run"

data = {
    "app_name": "image_2_scripts",
    "user_id": "dty123",
    "session_id": "16636341-ae71-4011-a245-80e36f09e73c",
    "new_message": {
        "role": "user",
        "parts": [{"text": "你好"}]
    }
}

print("发送请求:")
print(json.dumps(data, indent=2, ensure_ascii=False))

try:
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        json=data,
        timeout=30
    )
    print(f"\n状态码: {response.status_code}")
    print(f"响应: {response.text}")
except Exception as e:
    print(f"\n错误: {e}")
    import traceback
    traceback.print_exc()
