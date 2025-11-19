#!/bin/bash

# 设置环境变量（可选但推荐）
export PATH="/opt/homebrew/bin:$PATH"

# 启动前端服务
cd /Users/lixiao/Documents/投资/交易记录/stock_app
nohup /opt/homebrew/bin/npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# 启动后端服务
cd /Users/lixiao/Documents/投资/交易记录/stock_app_backend
nohup /opt/homebrew/bin/node server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# 保存PID到文件
echo $FRONTEND_PID > /tmp/stock_pids.txt
echo $BACKEND_PID >> /tmp/stock_pids.txt

# 等待服务启动
sleep 3

# 打开浏览器
open "http://localhost:5173"

# 显示通知
osascript -e 'display notification "股票交易记录系统已启动" with title "系统启动"'