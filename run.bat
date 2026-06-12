@echo off
setlocal

cd /d "%~dp0"

set "NODE_DIR=%LOCALAPPDATA%\Programs\nodejs"
if exist "%NODE_DIR%\node.exe" (
  set "PATH=%NODE_DIR%;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js could not be found.
  echo Install Node.js or add it to PATH, then run this file again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm could not be found.
  pause
  exit /b 1
)

if not exist "node_modules\react-scripts\bin\react-scripts.js" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting AI UML Builder at http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

call npm start

if errorlevel 1 (
  echo.
  echo [ERROR] The development server stopped with an error.
  pause
)

endlocal
