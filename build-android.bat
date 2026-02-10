@echo off
echo ========================================
echo   SAMAPE INDIO - Build Android APK
echo ========================================
echo.

echo [1/4] Copiando arquivos web...
copy index.html www\ >nul 2>&1
copy styles.css www\ >nul 2>&1
copy app.js www\ >nul 2>&1
copy os-modal.js www\ >nul 2>&1
xcopy resources www\resources\ /E /I /Y >nul 2>&1
echo ✓ Arquivos copiados

echo.
echo [2/4] Sincronizando com Capacitor...
call npx cap sync
echo ✓ Sincronização concluída

echo.
echo [3/4] Abrindo Android Studio...
echo (Aguarde o Android Studio abrir)
call npx cap open android

echo.
echo ========================================
echo   PRÓXIMOS PASSOS NO ANDROID STUDIO:
echo ========================================
echo 1. Aguarde o Gradle sincronizar
echo 2. Menu: Build → Build Bundle/APK → Build APK
echo 3. APK estará em: android\app\build\outputs\apk\debug\
echo ========================================
pause
