@echo off
echo ===================================================
echo   CRASHCUE+ APK GENERATOR
echo ===================================================
echo.
echo [1/2] Configuring environment (Bypassing Git check)...
set EAS_NO_VCS=1

echo.
echo [2/2] Launching Build Process...
echo       This will create an APK for Android.
echo.
call npx eas-cli build -p android --profile preview

echo.
echo ===================================================
echo   Build command finished.
echo   If successful, download the APK from the link above.
echo ===================================================
pause
