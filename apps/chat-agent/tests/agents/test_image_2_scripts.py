"""
测试 image_2_scripts agent 配置
"""
import os
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from image_2_scripts.agent import root_agent

def test_agent_config():
    """测试 agent 配置是否正确"""
    print("=" * 60)
    print("测试 image_2_scripts Agent 配置")
    print("=" * 60)
    
    # 检查环境变量
    api_key = os.getenv("GITCODE_API_KEY")
    if api_key:
        print(f"✅ GITCODE_API_KEY 已设置: {api_key[:10]}...")
    else:
        print("⚠️  GITCODE_API_KEY 未设置，使用默认值")
    
    # 检查 agent 配置
    print(f"\nAgent 名称: {root_agent.name}")
    print(f"Agent 描述: {root_agent.description}")
    
    # 检查模型配置
    if hasattr(root_agent, 'model'):
        model = root_agent.model
        print(f"\n模型类型: {type(model).__name__}")
        
        if hasattr(model, 'model'):
            print(f"模型名称: {model.model}")
        if hasattr(model, 'api_base'):
            print(f"API 端点: {model.api_base}")
        if hasattr(model, 'api_key'):
            key = model.api_key if hasattr(model, 'api_key') else "未设置"
            if key and len(str(key)) > 10:
                print(f"API Key: {str(key)[:10]}...")
            else:
                print(f"API Key: {key}")
    
    print("\n" + "=" * 60)
    print("配置检查完成")
    print("=" * 60)

if __name__ == "__main__":
    test_agent_config()
