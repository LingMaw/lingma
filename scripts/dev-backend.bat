@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 切换到脚本所在目录的上一级
cd /d "%~dp0.."

REM 设置默认值
set BACKEND_PORT=9871
set BACKEND_HOST=0.0.0.0

REM 读取 .env 文件中的配置（如果存在）
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (.env) do (
        set "key=%%a"
        set "value=%%b"
        if "!key!"=="PORT" set "BACKEND_PORT=!value!"
        if "!key!"=="HOST" set "BACKEND_HOST=!value!"
    )
)

REM 显示启动信息
echo 🚀 启动 LingMa 后端开发服务器...
echo.
echo 🌐 服务器地址: http://localhost:%BACKEND_PORT%
echo 📖 API 文档: http://localhost:%BACKEND_PORT%/docs
echo 💡 提示: 修改后端代码后，OpenAPI 规范和类型会自动更新
echo.

REM 启动服务器
uv run uvicorn src.backend.main:app --reload --host %BACKEND_HOST% --port %BACKEND_PORT%

endlocal