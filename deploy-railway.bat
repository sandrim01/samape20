@echo off
echo ========================================
echo   DEPLOY AUTOMATICO NA RAILWAY
echo ========================================
echo.

echo [1/6] Verificando Railway CLI...
where railway >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI nao encontrado
    echo.
    echo Instalando Railway CLI...
    npm install -g @railway/cli
    echo ✓ Railway CLI instalado
) else (
    echo ✓ Railway CLI ja instalado
)

echo.
echo [2/6] Fazendo login na Railway...
echo (Uma janela do navegador vai abrir)
railway login

echo.
echo [3/6] Criando projeto na Railway...
cd api-deploy
railway init

echo.
echo [4/6] Configurando variaveis de ambiente...
railway variables set DATABASE_URL="postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway"
railway variables set JWT_SECRET="samapeop-secret-key-2026-indio"
railway variables set PORT="3000"

echo.
echo [5/6] Fazendo deploy...
railway up

echo.
echo [6/6] Gerando dominio publico...
railway domain

echo.
echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo A URL da sua API sera exibida acima.
echo.
echo Copie a URL e atualize em:
echo   www/api-client.js (linha 4)
echo.
echo Depois execute:
echo   npx cap sync
echo   build-android.bat
echo.
echo ========================================
pause
