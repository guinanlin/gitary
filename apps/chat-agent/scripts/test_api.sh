#!/bin/bash

# 测试 FastAPI REST API

BASE_URL="http://127.0.0.1:8234"
APP_NAME="image_2_scripts"
USER_ID="test_user_001"

# 检查是否安装了 jq
if command -v jq &> /dev/null; then
    JQ_CMD="jq '.'"
else
    JQ_CMD="cat"
    echo "注意: 未安装 jq，将输出原始 JSON（建议安装 jq 以获得更好的格式化输出）"
    echo ""
fi

echo "=========================================="
echo "步骤 0: 创建会话"
echo "=========================================="
SESSION_RESPONSE=$(curl -s -X POST "${BASE_URL}/adk/apps/${APP_NAME}/users/${USER_ID}/sessions" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json")

echo "$SESSION_RESPONSE" | eval $JQ_CMD

# 提取 session_id
if command -v jq &> /dev/null; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.id // .session_id // empty')
else
    # 简单提取 session_id（如果没有 jq）
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$SESSION_ID" ]; then
        SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
fi

if [ -z "$SESSION_ID" ]; then
    echo "❌ 无法提取 session_id，使用默认值"
    SESSION_ID="test_session_$(date +%s)"
else
    echo "✅ 使用会话 ID: $SESSION_ID"
fi

echo -e "\n\n=========================================="
echo "测试 1: 简单文本消息"
echo "=========================================="
curl -s -X POST "${BASE_URL}/adk/run" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Accept: application/json" \
  --data-raw "{
    \"app_name\": \"${APP_NAME}\",
    \"user_id\": \"${USER_ID}\",
    \"session_id\": \"${SESSION_ID}\",
    \"new_message\": {
      \"role\": \"user\",
      \"parts\": [
        {
          \"text\": \"hello\"
        }
      ]
    }
  }" | eval $JQ_CMD

echo -e "\n\n=========================================="
echo "测试 2: 中文消息（使用 JSON 文件）"
echo "=========================================="
# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHINESE_FILE="${SCRIPT_DIR}/test_request_chinese.json"

if [ -f "$CHINESE_FILE" ]; then
    # 创建临时文件（兼容 Windows）
    if [ -n "$TMPDIR" ]; then
        TEMP_DIR="$TMPDIR"
    elif [ -n "$TMP" ]; then
        TEMP_DIR="$TMP"
    else
        TEMP_DIR="/tmp"
    fi
    TEMP_CHINESE="${TEMP_DIR}/test_chinese_$$.json"
    
    # 复制模板文件并替换 session_id（兼容 Windows sed）
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows Git Bash
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/g" "$CHINESE_FILE" > "$TEMP_CHINESE"
    else
        # Linux/Mac
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" "$CHINESE_FILE" > "$TEMP_CHINESE"
    fi
    
    curl -s -X POST "${BASE_URL}/adk/run" \
      -H "Content-Type: application/json; charset=utf-8" \
      -H "Accept: application/json" \
      -d "@${TEMP_CHINESE}" | eval $JQ_CMD
    rm -f "$TEMP_CHINESE" 2>/dev/null
else
    echo "⚠️  文件不存在: $CHINESE_FILE，跳过测试"
    echo "   提示: 请确保 test_request_chinese.json 文件存在于脚本目录"
fi

echo -e "\n\n=========================================="
echo "测试 3: 带图片 URL 的消息（使用 JSON 文件）"
echo "=========================================="
IMAGE_FILE="${SCRIPT_DIR}/test_request_image.json"

if [ -f "$IMAGE_FILE" ]; then
    # 创建临时文件（兼容 Windows）
    TEMP_IMAGE="${TEMP_DIR}/test_image_$$.json"
    
    # 复制模板文件并替换 session_id（兼容 Windows sed）
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows Git Bash
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/g" "$IMAGE_FILE" > "$TEMP_IMAGE"
    else
        # Linux/Mac
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" "$IMAGE_FILE" > "$TEMP_IMAGE"
    fi
    
    curl -s -X POST "${BASE_URL}/adk/run" \
      -H "Content-Type: application/json; charset=utf-8" \
      -H "Accept: application/json" \
      -d "@${TEMP_IMAGE}" | eval $JQ_CMD
    rm -f "$TEMP_IMAGE" 2>/dev/null
else
    echo "⚠️  文件不存在: $IMAGE_FILE，跳过测试"
    echo "   提示: 请确保 test_request_image.json 文件存在于脚本目录"
fi

echo -e "\n\n=========================================="
echo "测试 4: 健康检查"
echo "=========================================="
curl -s -X GET "${BASE_URL}/health" | eval $JQ_CMD

echo -e "\n\n=========================================="
echo "测试 5: 列出可用应用"
echo "=========================================="
curl -s -X GET "${BASE_URL}/adk/apps" | eval $JQ_CMD
