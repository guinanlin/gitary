# Makefile 使用指南

## 什么是 Makefile？

Makefile 是一个配置文件，定义了项目的各种任务（targets）。使用 `make` 命令可以执行这些任务。

## Makefile 基本语法

```makefile
target: dependencies
    command1
    command2
```

- **target**: 任务名称（如 `dev`, `run`, `test`）
- **dependencies**: 依赖的其他任务（可选）
- **command**: 要执行的命令（必须以 Tab 开头，不能用空格）

## 当前项目的 Makefile 解析

### 1. `.PHONY` 声明

```makefile
.PHONY: help setup install run test clean dev web
```

这告诉 make 这些是"伪目标"（不是文件名），即使存在同名文件也会执行。

### 2. `help` - 显示帮助信息

```bash
make help
```

显示所有可用命令的说明。

### 3. `setup` - 首次设置

```bash
make setup
```

- 检查并安装 `uv`（如果未安装）
- 同步项目依赖
- 提示配置 `.env` 文件

### 4. `install` - 安装依赖

```bash
make install
```

等同于 `uv sync --no-install-project`，安装项目依赖。

### 5. `run` - 启动 FastAPI 服务器

```bash
make run
```

- 检查 `.env` 文件是否存在
- 启动 FastAPI 服务器（端口 8234）

### 6. `dev` - 启动 ADK Dev UI

```bash
make dev
```

- 检查 `.env` 文件是否存在
- 设置默认端口 8334（可通过 `ADK_PORT` 环境变量覆盖）
- 启动 ADK Dev UI

**使用自定义端口：**
```bash
# Git Bash
ADK_PORT=8335 make dev

# Windows CMD
set ADK_PORT=8335 && make dev

# Windows PowerShell
$env:ADK_PORT=8335; make dev
```

### 7. `web` - `dev` 的别名

```bash
make web
```

等同于 `make dev`。

### 8. `test` - 运行测试

```bash
make test
```

- 检查 `.env` 文件
- 运行测试脚本

### 9. `clean` - 清理生成的文件

```bash
make clean
```

- 清理 `uv` 缓存
- 删除 Python 缓存文件（`__pycache__`, `*.pyc`）
- 删除构建产物（`*.egg-info`）

## Makefile 的优势

1. **统一接口**: 所有项目任务都有统一的命令格式
2. **自动化**: 可以组合多个步骤
3. **跨平台**: 同样的命令在不同系统上都能工作
4. **文档化**: Makefile 本身就是很好的文档

## 常用命令示例

```bash
# 查看帮助
make help

# 首次设置项目
make setup

# 启动开发服务器
make run

# 启动 ADK Dev UI
make dev

# 运行测试
make test

# 清理临时文件
make clean
```
