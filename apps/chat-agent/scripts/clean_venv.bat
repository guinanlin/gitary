@echo off
echo 正在关闭可能使用虚拟环境的进程...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM pythonw.exe /T 2>nul

echo.
echo 等待进程完全关闭...
timeout /t 2 /nobreak >nul

echo.
echo 正在删除 .venv 目录...
if exist .venv (
    rmdir /s /q .venv
    echo .venv 目录已删除
) else (
    echo .venv 目录不存在
)

echo.
echo 清理完成！现在可以运行: uv sync
pause
