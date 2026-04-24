@echo off
setlocal

echo 3000 ve 8000 portlarini kullanan eski surecler kapatiliyor...

for %%P in (3000 8000) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%I"=="0" (
      echo Port %%P - PID %%I kapatiliyor...
      taskkill /PID %%I /F >nul 2>nul
    )
  )
)

echo.
call "%~dp0start_hastane.bat"

endlocal
exit /b 0

