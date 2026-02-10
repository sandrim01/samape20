@echo off
echo ========================================
echo   UPLOAD PARA RAILWAY (VERSAO CORRIGIDA)
echo ========================================
echo.

echo [1/3] Sincronizando arquivos locais...
copy /Y api-server.js api-deploy\api-server.js
xcopy /E /I /Y www api-deploy\www
echo ✓ Arquivos preparados em api-deploy/
echo.

echo [2/3] Verificando login...
echo Se voce nao estiver logado, o navegador abrira para autorizacao.
call npx -y @railway/cli@latest login
echo.

echo [3/3] Enviando para o Railway...
cd api-deploy
call npx -y @railway/cli@latest up
echo.

echo ========================================
echo   PROCESSO CONCLUIDO!
echo ========================================
echo.
echo Se o upload foi bem-sucedido, o App estara disponivel em:
echo https://samape20-estudioio.up.railway.app/
echo.
pause
