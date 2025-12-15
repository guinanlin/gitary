@echo off

REM 检查 uv 是否安装
where uv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ uv is not installed!
    echo Please install uv first:
    echo   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    echo   or: pip install uv
    pause
    exit /b 1
)

echo Using uv version:
uv --version

REM 同步依赖（uv 会自动创建虚拟环境）
REM 使用 --no-install-project 因为这是应用而不是库
echo Syncing dependencies with uv...
uv sync --no-install-project

REM 检查 .env 文件
if not exist "src\agents\hello_agent\.env" (
    echo Warning: src\agents\hello_agent\.env not found!
    echo Please copy src\agents\hello_agent\.env.example to src\agents\hello_agent\.env and add your GOOGLE_API_KEY
    pause
    exit /b 1
)

REM 启动服务器（使用 uv run）
echo Starting FastAPI server on port 8234...
uv run python -m src.main

pause
