#!/bin/bash

# 测试 GitCode API 的不同格式

API_KEY="ZjuVRwW1DQxssBQfLwAb7Qmr"
API_BASE="https://api.gitcode.com/api/v5"

echo "测试 1: deepseek-ai/deepseek-vl2"
curl -X POST "${API_BASE}/chat/completions" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-vl2",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 50
  }'

echo -e "\n\n测试 2: deepseek-vl2"
curl -X POST "${API_BASE}/chat/completions" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-vl2",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 50
  }'

echo -e "\n\n测试 3: deepseek/deepseek-vl2"
curl -X POST "${API_BASE}/chat/completions" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-vl2",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 50
  }'
