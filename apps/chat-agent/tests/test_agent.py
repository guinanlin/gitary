#!/usr/bin/env python3
"""
简单的测试脚本，用于验证 ADK Agent 是否正常工作
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8234"

def create_session(app_name: str, user_id: str):
    """创建会话"""
    try:
        print(f"  Creating session for app={app_name}, user={user_id}...")
        response = requests.post(
            f"{BASE_URL}/adk/apps/{app_name}/users/{user_id}/sessions",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"  Session creation response: {response.status_code}")
        if response.status_code in [200, 201]:
            session_data = response.json()
            # ADK 返回的 session_id 在 "id" 字段中
            session_id = session_data.get("id") or session_data.get("session_id")
            if session_id:
                print(f"  ✅ Session created: {session_id}")
                return session_id
            else:
                print(f"  ⚠️  Response missing session id: {session_data}")
                return None
        else:
            print(f"  ⚠️  Failed to create session: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"  ⚠️  Error creating session: {e}")
        import traceback
        traceback.print_exc()
        return None

def list_apps():
    """列出可用的应用"""
    try:
        # 尝试访问 ADK 的根端点或应用列表
        response = requests.get(f"{BASE_URL}/adk/")
        if response.status_code == 200:
            print("Available apps info:", response.json())
        return True
    except Exception as e:
        print(f"Could not list apps: {e}")
        return False

def test_health():
    """测试健康检查端点"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed:", response.json())
            return True
        else:
            print("❌ Health check failed:", response.status_code)
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_agent_sync():
    """测试同步 Agent 调用"""
    print("\nTesting synchronous agent call...")
    try:
        # 先创建会话
        app_name = "hello_agent"
        user_id = "test-user"
        session_id = create_session(app_name, user_id)
        
        if not session_id:
            print("❌ Cannot proceed without valid session_id")
            return False
        
        response = requests.post(
            f"{BASE_URL}/adk/run",
            json={
                "app_name": app_name,
                "user_id": user_id,
                "session_id": session_id,
                "new_message": {
                    "role": "user",
                    "parts": [
                        {
                            "text": "Hello! Can you introduce yourself?"
                        }
                    ]
                }
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Agent response received:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return True
        else:
            print(f"❌ Agent call failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Agent call error: {e}")
        return False

def test_agent_stream():
    """测试流式 Agent 调用"""
    print("\nTesting streaming agent call...")
    try:
        # 先创建会话
        app_name = "hello_agent"
        user_id = "test-user"
        session_id = create_session(app_name, user_id)
        
        if not session_id:
            print("❌ Cannot proceed without valid session_id")
            return False
        
        response = requests.post(
            f"{BASE_URL}/adk/run_sse",
            json={
                "app_name": app_name,
                "user_id": user_id,
                "session_id": session_id,
                "new_message": {
                    "role": "user",
                    "parts": [
                        {
                            "text": "Tell me a joke!"
                        }
                    ]
                }
            },
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=30
        )
        if response.status_code == 200:
            print("✅ Streaming response received:")
            print("-" * 50)
            buffer = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('event: '):
                        event_type = line_str[7:].strip()
                        print(f"\n[Event Type: {event_type}]")
                    elif line_str.startswith('data: '):
                        data = line_str[6:]  # 移除 'data: ' 前缀
                        if data and data != '[DONE]':
                            try:
                                event = json.loads(data)
                                print(f"  Data: {json.dumps(event, indent=2, ensure_ascii=False)}")
                            except json.JSONDecodeError:
                                print(f"  Data: {data}")
            print("-" * 50)
            return True
        else:
            print(f"❌ Streaming call failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Streaming call error: {e}")
        return False

def main():
    print("=" * 50)
    print("ADK Agent Test Suite")
    print("=" * 50)
    
    # 检查服务器是否运行
    if not test_health():
        print("\n❌ Server is not running or not accessible.")
        print("Please start the server first: python main.py")
        sys.exit(1)
    
    # 尝试列出可用的应用（用于调试）
    print("\nChecking available apps...")
    list_apps()
    
    # 运行测试
    results = []
    results.append(("Health Check", test_health()))
    results.append(("Sync Agent Call", test_agent_sync()))
    results.append(("Stream Agent Call", test_agent_stream()))
    
    # 总结
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    if all_passed:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Please check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
