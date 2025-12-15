#!/bin/bash

# 测试多张图片批量处理功能
# 用于测试 image_2_scripts 智能体的三步处理流程（理解图片 -> 生成口播文案 -> JSON格式返回）

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
echo "测试：多张图片批量处理（批量口播文案生成）"
echo "=========================================="
echo ""
echo "功能说明："
echo "1. 第一步：理解图片（分析视觉内容、文字内容、图表数据、核心主题）"
echo "2. 第二步：生成口播文案（基于理解结果，生成300-400字的专业口播文案）"
echo "3. 第三步：JSON格式返回（结构化数据，便于程序处理）"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "步骤 1: 创建会话"
echo "----------------------------------------"
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

echo ""
echo "=========================================="
echo "步骤 2: 测试单张图片处理"
echo "=========================================="
echo ""
echo "预期输出：JSON格式，包含 understanding 和 narration_script 字段"
echo ""

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
          \"text\": \"https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg\"
        }
      ]
    }
  }" | eval $JQ_CMD

echo ""
echo ""
echo "=========================================="
echo "步骤 3: 测试多张图片批量处理（3张图片）"
echo "=========================================="
echo ""
echo "预期输出：JSON格式，包含3张图片的结果，每张图片都有独立的 understanding 和 narration_script"
echo ""

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
          \"text\": \"https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg\"
        },
        {
          \"text\": \"https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg\"
        },
        {
          \"text\": \"https://pic1.imgdb.cn/item/690dd3843203f7be00e1c52b.jpg\"
        }
      ]
    }
  }" | eval $JQ_CMD

echo ""
echo ""
echo "=========================================="
echo "步骤 4: 使用 JSON 文件测试（test_request_multiple_images.json）"
echo "=========================================="
echo ""

MULTIPLE_IMAGES_FILE="${SCRIPT_DIR}/test_request_multiple_images.json"

if [ -f "$MULTIPLE_IMAGES_FILE" ]; then
    # 创建临时文件（兼容 Windows）
    if [ -n "$TMPDIR" ]; then
        TEMP_DIR="$TMPDIR"
    elif [ -n "$TMP" ]; then
        TEMP_DIR="$TMP"
    else
        TEMP_DIR="/tmp"
    fi
    TEMP_FILE="${TEMP_DIR}/test_multiple_images_$$.json"
    
    # 复制模板文件并替换 session_id（兼容 Windows sed）
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows Git Bash
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/g" "$MULTIPLE_IMAGES_FILE" > "$TEMP_FILE"
    else
        # Linux/Mac
        sed "s/YOUR_SESSION_ID_HERE/${SESSION_ID}/" "$MULTIPLE_IMAGES_FILE" > "$TEMP_FILE"
    fi
    
    echo "使用的请求文件内容："
    cat "$TEMP_FILE" | eval $JQ_CMD
    echo ""
    echo "响应结果："
    
    curl -s -X POST "${BASE_URL}/adk/run" \
      -H "Content-Type: application/json; charset=utf-8" \
      -H "Accept: application/json" \
      -d "@${TEMP_FILE}" | eval $JQ_CMD
    
    rm -f "$TEMP_FILE" 2>/dev/null
else
    echo "⚠️  文件不存在: $MULTIPLE_IMAGES_FILE，跳过测试"
    echo "   提示: 请确保 test_request_multiple_images.json 文件存在于脚本目录"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "验证要点："
echo "1. ✅ 返回的JSON格式是否正确（total_images、images数组）"
echo "2. ✅ 每张图片是否包含 image_index、image_url、understanding、narration_script 字段"
echo "3. ✅ understanding 字段是否包含对图片的详细理解和分析"
echo "4. ✅ narration_script 字段是否为300-400字的口播文案"
echo "5. ✅ 多张图片时，是否为每张图片生成了独立的结果"
echo ""

