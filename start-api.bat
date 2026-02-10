@echo off
echo ========================================
echo   SAMAPE INDIO - Iniciar API Server
echo ========================================
echo.

echo [1/2] Verificando conexão com banco de dados...
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('SELECT 1').then(()=>{console.log('✓ Banco conectado');p.end()}).catch(e=>{console.log('✗ Erro:',e.message);p.end()})"

echo.
echo [2/2] Iniciando servidor API...
echo.
echo ========================================
echo   API RODANDO!
echo ========================================
echo.
echo 📡 URL: http://localhost:3000
echo 🔗 Database: PostgreSQL (Railway)
echo.
echo Rotas disponíveis:
echo   POST /api/login
echo   GET  /api/clientes
echo   GET  /api/maquinas
echo   GET  /api/ordens
echo   GET  /api/pecas
echo   GET  /api/vendas
echo   GET  /api/stats
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

node api-server.js
