@echo off
echo 🚀 Starting CrashCue+ AI API Server...
echo.

cd api-server

echo 📦 Installing dependencies...
call npm install

echo.
echo 🗄️ Creating database and directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "models" mkdir models

echo.
echo 🔧 Setting up environment...
if not exist ".env" (
    copy env.example .env
    echo ✅ Created .env file from template
    echo ⚠️  Please update .env with your configuration
)

echo.
echo 🚀 Starting API server on port 3001...
echo 📊 Health check: http://localhost:3001/health
echo 🔗 API Base URL: http://localhost:3001/api
echo.

call node start-server.js

pause










