#!/bin/bash

# 推送 v1.1.1 版本到 GitHub
# 使用方法：
# 1. 将 YOUR_USERNAME 替换为你的 GitHub 用户名
# 2. 将 YOUR_TOKEN 替换为你的 Personal Access Token
# 3. 运行脚本：bash push_v1.1.1.sh

# 配置（请修改这里）
GITHUB_USERNAME="1425673985"
GITHUB_TOKEN="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"

# 远程仓库地址（不含协议）
REMOTE_URL="github.com/1425673985/nearby-noodles.git"

echo "🚀 开始推送 v1.1.1 版本到 GitHub..."
echo "仓库: $REMOTE_URL"
echo "版本: v1.1.1"

# 推送代码
echo "📤 推送代码..."
if git push https://$GITHUB_USERNAME:$GITHUB_TOKEN@$REMOTE_URL; then
    echo "✅ 代码推送成功"
else
    echo "❌ 代码推送失败，请检查用户名和token"
    exit 1
fi

# 推送标签
echo "🏷️ 推送标签..."
if git push https://$GITHUB_USERNAME:$GITHUB_TOKEN@$REMOTE_URL v1.1.1; then
    echo "✅ 标签推送成功"
else
    echo "❌ 标签推送失败，请检查用户名和token"
    exit 1
fi

echo ""
echo "🎉 推送完成！"
echo "请访问以下地址验证："
echo "https://github.com/1425673985/nearby-noodles"