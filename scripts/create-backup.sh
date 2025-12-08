#!/bin/bash

# 创建备份分支和标签脚本

set -e

# 获取当前日期
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔐 创建备份分支和标签..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  检测到未提交的更改"
  echo "请先提交或暂存所有更改"
  exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 创建备份分支
BACKUP_BRANCH="refactor/backup-$DATE"
echo "创建备份分支: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
git push -u origin "$BACKUP_BRANCH"

# 创建标签
TAG_NAME="refactor/before-refactor-$TIMESTAMP"
echo "创建标签: $TAG_NAME"
git tag -a "$TAG_NAME" -m "重构前的备份点 - $TIMESTAMP"
git push origin "$TAG_NAME"

# 返回原分支
git checkout "$CURRENT_BRANCH"

echo ""
echo "✅ 备份完成！"
echo "  备份分支: $BACKUP_BRANCH"
echo "  备份标签: $TAG_NAME"

