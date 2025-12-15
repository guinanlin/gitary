# 在 Windows 上安装 Make

## 方法 1：使用 Chocolatey（推荐，如果已安装）

如果你已经安装了 Chocolatey：

```powershell
# 在 PowerShell (管理员模式) 中运行
choco install make
```

安装后，在 Git Bash 中验证：
```bash
make --version
```

## 方法 2：下载预编译版本（最简单）

1. **下载 make for Windows**：
   - 访问：https://sourceforge.net/projects/ezwinports/files/
   - 下载：`make-4.x-without-guile-w32-bin.zip`（最新版本）

2. **解压文件**：
   - 解压到任意目录（如：`D:\programs\make-4.4.1-without-guile-w32-bin`）
   - **重要**：`make.exe` 在 `bin` 子目录下

3. **添加到 PATH**：

   **方式 A：通过系统设置（永久）**
   - 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
   - 在"系统变量"中找到 `Path`，点击"编辑"
   - 点击"新建"，添加：`D:\programs\make-4.4.1-without-guile-w32-bin\bin`
   - 点击"确定"保存
   - **重启 PowerShell 或 Git Bash**

   **方式 B：通过 PowerShell（永久）**
   ```powershell
   # 添加到用户 PATH
   $makePath = "D:\programs\make-4.4.1-without-guile-w32-bin\bin"
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   if ($currentPath -notlike "*$makePath*") {
       [Environment]::SetEnvironmentVariable("Path", "$currentPath;$makePath", "User")
       Write-Host "✅ Added to PATH. Please restart PowerShell."
   }
   ```

   **方式 C：在 Git Bash 中临时添加（仅当前会话）**
   ```bash
   # 在 Git Bash 中运行
   export PATH="$PATH:/d/programs/make-4.4.1-without-guile-w32-bin/bin"
   make --version
   ```

   **方式 D：在 Git Bash 中永久添加**
   ```bash
   # 编辑 ~/.bashrc
   echo 'export PATH="$PATH:/d/programs/make-4.4.1-without-guile-w32-bin/bin"' >> ~/.bashrc
   source ~/.bashrc
   make --version
   ```

4. **验证安装**：
   ```bash
   # Git Bash
   make --version
   
   # PowerShell
   make --version
   ```

## 方法 3：使用 MSYS2（如果已安装）

如果你有 MSYS2：

```bash
# 在 MSYS2 终端中
pacman -S make
```

## 方法 4：使用 Scoop（如果已安装）

如果你有 Scoop：

```powershell
scoop install make
```

## 验证安装

安装完成后，在 Git Bash 中运行：

```bash
make --version
```

应该看到类似输出：
```
GNU Make 4.x
```

## 如果不想安装 make

你也可以直接使用脚本文件：
- **Git Bash**: `./dev.sh`
- **Windows CMD**: `dev.bat`
- **PowerShell**: `.\dev.bat`

这些脚本提供与 `make dev` 相同的功能。
