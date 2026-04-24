@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\manage.py" (
  echo [HATA] Backend klasoru bulunamadi: %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo [HATA] Frontend klasoru bulunamadi: %FRONTEND%
  pause
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo [HATA] Python bulunamadi. Lutfen Python kurulumunu kontrol et.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [HATA] npm bulunamadi. Lutfen Node.js kurulumunu kontrol et.
  pause
  exit /b 1
)

set "PYTHON_CMD="
for /f "delims=" %%I in ('where python 2^>nul') do (
  if not defined PYTHON_CMD set "PYTHON_CMD=%%I"
)

set "NPM_CMD="
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do (
  if not defined NPM_CMD set "NPM_CMD=%%I"
)
if not defined NPM_CMD (
  for /f "delims=" %%I in ('where npm 2^>nul') do (
    if not defined NPM_CMD set "NPM_CMD=%%I"
  )
)

if not defined PYTHON_CMD (
  echo [HATA] Python executable yolu bulunamadi.
  pause
  exit /b 1
)

if not defined NPM_CMD (
  echo [HATA] npm executable yolu bulunamadi.
  pause
  exit /b 1
)

call :is_listening 8000
if errorlevel 1 goto start_backend
echo Backend zaten calisiyor (8000).
goto backend_done

:start_backend
echo Backend baslatiliyor...
start "MediShift Backend" cmd /k "cd /d ""%BACKEND%"" && ""%PYTHON_CMD%"" manage.py runserver 0.0.0.0:8000"

:backend_done

call :is_listening 3000
if errorlevel 1 goto start_frontend
echo Frontend zaten calisiyor (3000).
goto frontend_done

:start_frontend
echo Frontend baslatiliyor...
start "MediShift Frontend" cmd /k "cd /d ""%FRONTEND%"" && set NEXT_DISABLE_SWC_WORKER=1 && ""%NPM_CMD%"" run dev -- -H 0.0.0.0 -p 3000"

:frontend_done

echo.
echo Proje baslatildi.
echo Frontend: http://localhost:3000/
echo Backend : http://localhost:8000/
echo.
start "" "http://localhost:3000/"
exit /b 0

:is_listening
netstat -ano | findstr /R /C:":%1 .*LISTENING" >nul
if errorlevel 1 (exit /b 1)
exit /b 0

