#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

message="${1:-更新記帳 App}"

git add -A

if git diff --cached --quiet; then
  echo "沒有新修改需要上傳。"
  exit 0
fi

git commit -m "$message"
git push origin main

echo "已上傳到 GitHub。GitHub Pages 會自動更新。"
