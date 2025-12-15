"""
直接测试请求格式
"""
import requests
import json
import sys

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

print("=" * 60)
print("测试请求格式")
print("=" * 60)
print("\n发送的 JSON:")
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
    
    if response.status_code == 422:
        try:
            error_detail = response.json()
            print("\n详细错误信息:")
            print(json.dumps(error_detail, indent=2, ensure_ascii=False))
        except:
            pass
            
except requests.exceptions.ConnectionError:
    print("\n错误: 无法连接到服务器，请确保服务器正在运行")
    print("运行: uv run python main.py")
except Exception as e:
    print(f"\n错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
