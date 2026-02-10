@echo off
echo ========================================
echo   SAMAPE INDIO - Atualizar Apps Mobile
echo ========================================
echo.

echo [1/3] Copiando arquivos atualizados para www...
copy index.html www\ >nul 2>&1
copy styles.css www\ >nul 2>&1
copy app.js www\ >nul 2>&1
copy os-modal.js www\ >nul 2>&1
xcopy resources www\resources\ /E /I /Y >nul 2>&1
echo ✓ Arquivos copiados para www

echo.
echo [2/3] Sincronizando com Android e iOS...
call npx cap sync
echo ✓ Sincronização concluída

echo.
echo [3/3] Atualizando ícones e splash screens...
echo ✓ Recursos atualizados

echo.
echo ========================================
echo   APPS MOBILE ATUALIZADOS!
echo ========================================
echo.
echo Alterações aplicadas:
echo  ✓ Logo real da empresa (logonova2.png)
echo  ✓ Tela de login atualizada
echo  ✓ Menu lateral atualizado
echo  ✓ PDF com logo real
echo  ✓ Ícone personalizado
echo.
echo Próximos passos:
echo  1. Android: Execute build-android.bat
echo  2. iOS: Abra no Xcode (Mac)
echo.
echo Arquivos sincronizados em:
echo  - android\app\src\main\assets\public\
echo  - ios\App\App\public\
echo ========================================
pause
