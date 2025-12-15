"""
测试 GitCode API 的正确格式
"""
import requests
import json

API_KEY = "ZjuVRwW1DQxssBQfLwAb7Qmr"
API_BASE = "https://api.gitcode.com/api/v5"

def test_model_name_variants():
    """测试不同的模型名称格式"""
    
    model_names = [
        "deepseek-ai/deepseek-vl2",
        "deepseek-vl2",
        "deepseek/deepseek-vl2",
    ]
    
    for model_name in model_names:
        print(f"\n{'='*60}")
        print(f"测试模型名称: {model_name}")
        print(f"{'='*60}")
        
        url = f"{API_BASE}/chat/completions"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        # 测试 1: 简单文本消息
        data1 = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, this is a test."
                }
            ],
            "max_tokens": 50
        }
        
        try:
            print(f"\n测试 1: 简单文本消息")
            print(f"请求: {json.dumps(data1, indent=2, ensure_ascii=False)}")
            response = requests.post(url, json=data1, headers=headers, timeout=30)
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:500]}")
            
            if response.status_code == 200:
                print("✅ 成功!")
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0].get('message', {}).get('content', '')
                    print(f"模型回复: {content[:200]}")
                return model_name
            else:
                print(f"❌ 失败: {response.text}")
        except Exception as e:
            print(f"❌ 异常: {e}")
    
    return None

def test_with_content_array():
    """测试使用 content 数组格式（用于图片）"""
    print(f"\n{'='*60}")
    print("测试 content 数组格式")
    print(f"{'='*60}")
    
    url = f"{API_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 使用 content 数组格式
    data = {
        "model": "deepseek-ai/deepseek-vl2",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "用一句话描述这张图片"
                    }
                ]
            }
        ],
        "max_tokens": 100
    }
    
    try:
        print(f"请求: {json.dumps(data, indent=2, ensure_ascii=False)}")
        response = requests.post(url, json=data, headers=headers, timeout=30)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:500]}")
        
        if response.status_code == 200:
            print("✅ 成功!")
        else:
            print(f"❌ 失败: {response.text}")
    except Exception as e:
        print(f"❌ 异常: {e}")

if __name__ == "__main__":
    print("GitCode API 格式测试")
    print("=" * 60)
    
    # 测试不同的模型名称
    working_model = test_model_name_variants()
    
    if working_model:
        print(f"\n✅ 找到可用的模型名称: {working_model}")
    else:
        print("\n❌ 所有模型名称格式都失败")
    
    # 测试 content 数组格式
    test_with_content_array()
