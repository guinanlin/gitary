"""
调试 image_2_scripts agent 的脚本
用于诊断配置和连接问题
"""
import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8234")
APP_NAME = "image_2_scripts"
USER_ID = "debug-user"

def test_api_endpoint():
    """测试 GitCode API 端点是否可访问"""
    print("=" * 60)
    print("测试 GitCode API 端点")
    print("=" * 60)
    
    api_key = os.getenv("GITCODE_API_KEY", "vz_UxP1tDEzXV5H3-9cfByDB")
    api_base = "https://api.gitcode.com/api/v5"
    
    url = f"{api_base}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-ai/deepseek-vl2",
        "messages": [
            {
                "role": "user",
                "content": "Hello, this is a test message."
            }
        ],
        "max_tokens": 50
    }
    
    try:
        print(f"请求 URL: {url}")
        print(f"使用 API Key: {api_key[:10]}...")
        response = requests.post(url, json=data, headers=headers, timeout=30)
        
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print("✅ API 端点可访问")
            result = response.json()
            print(f"响应: {result.get('choices', [{}])[0].get('message', {}).get('content', 'N/A')[:100]}")
        else:
            print(f"❌ API 调用失败")
            print(f"错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")

def test_agent_list():
    """测试 agent 列表"""
    print("\n" + "=" * 60)
    print("测试 Agent 列表")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/adk/apps", timeout=10)
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            apps = data.get("apps", [])
            print(f"✅ 找到 {len(apps)} 个 agents:")
            for app in apps:
                print(f"  - {app}")
            if APP_NAME in apps:
                print(f"✅ {APP_NAME} 已注册")
            else:
                print(f"❌ {APP_NAME} 未找到")
        else:
            print(f"❌ 请求失败: {response.text}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")

def test_session_creation():
    """测试会话创建"""
    print("\n" + "=" * 60)
    print("测试会话创建")
    print("=" * 60)
    
    try:
        url = f"{BASE_URL}/adk/apps/{APP_NAME}/users/{USER_ID}/sessions"
        response = requests.post(url, timeout=10)
        print(f"状态码: {response.status_code}")
        if response.status_code in [200, 201]:
            data = response.json()
            session_id = data.get("id") or data.get("session_id")
            if session_id:
                print(f"✅ 会话创建成功: {session_id}")
                return session_id
            else:
                print(f"⚠️  响应中没有 session_id: {data}")
        else:
            print(f"❌ 会话创建失败: {response.text}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")
    
    return None

def test_agent_run(session_id):
    """测试 agent 运行"""
    print("\n" + "=" * 60)
    print("测试 Agent 运行")
    print("=" * 60)
    
    if not session_id:
        print("❌ 没有有效的 session_id，跳过测试")
        return
    
    try:
        url = f"{BASE_URL}/adk/run"
        data = {
            "app_name": APP_NAME,
            "user_id": USER_ID,
            "session_id": session_id,
            "new_message": {
                "role": "user",
                "parts": [{"text": "Hello, 这是一条测试消息"}]
            }
        }
        
        print(f"发送请求到: {url}")
        print(f"数据: {data}")
        
        response = requests.post(url, json=data, timeout=60)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Agent 运行成功")
            print(f"响应: {result}")
        else:
            print(f"❌ Agent 运行失败")
            print(f"错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 连接失败: {e}")

def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("Image 2 Scripts Agent 调试工具")
    print("=" * 60)
    
    # 1. 测试 API 端点
    test_api_endpoint()
    
    # 2. 测试 agent 列表
    test_agent_list()
    
    # 3. 测试会话创建
    session_id = test_session_creation()
    
    # 4. 测试 agent 运行
    if session_id:
        test_agent_run(session_id)
    
    print("\n" + "=" * 60)
    print("调试完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
