# 🚀 API REST + POSTGRESQL - SAMAPE ÍNDIO

## ✅ SISTEMA COMPLETO CRIADO!

### 📊 **ARQUITETURA:**

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  APP MOBILE │ ───▶ │  API REST    │ ───▶ │  POSTGRESQL     │
│  (Android)  │      │  (Node.js)   │      │  (Railway)      │
└─────────────┘      └──────────────┘      └─────────────────┘
       ▲                    ▲                       ▲
       │                    │                       │
   Capacitor          Express.js              10 Tabelas
   HTML/CSS/JS        JWT Auth               Relacionadas
```

---

## 📁 **ARQUIVOS CRIADOS:**

### **1. Backend (API):**
- ✅ `api-server.js` - Servidor API REST completo
- ✅ `.env` - Configurações (DATABASE_URL, JWT_SECRET, PORT)
- ✅ `start-api.bat` - Script para iniciar API

### **2. Frontend (Mobile):**
- ✅ `www/api-client.js` - Cliente API para mobile
- ✅ `www/index.html` - Atualizado com api-client.js

### **3. Database:**
- ✅ `migrations.js` - Criação das tabelas
- ✅ `BANCO-DE-DADOS.md` - Documentação

---

## 🔌 **API REST - ROTAS DISPONÍVEIS:**

### **Autenticação:**
```
POST /api/login
Body: { "email": "admin@samapeop.com", "senha": "admin123" }
Response: { "success": true, "user": {...}, "token": "..." }
```

### **Clientes:**
```
GET    /api/clientes           - Listar todos
POST   /api/clientes           - Criar novo
PUT    /api/clientes/:id       - Atualizar
DELETE /api/clientes/:id       - Deletar (soft delete)
```

### **Máquinas:**
```
GET    /api/maquinas           - Listar todas
POST   /api/maquinas           - Criar nova
```

### **Ordens de Serviço:**
```
GET    /api/ordens             - Listar todas
GET    /api/ordens/:id         - Obter específica (para PDF)
POST   /api/ordens             - Criar nova
```

### **Peças:**
```
GET    /api/pecas              - Listar todas
```

### **Vendas:**
```
GET    /api/vendas             - Listar todas
```

### **Contas:**
```
GET    /api/contas-receber     - Listar contas a receber
GET    /api/contas-pagar       - Listar contas a pagar
```

### **Estatísticas:**
```
GET    /api/stats              - Dashboard stats
```

### **Health Check:**
```
GET    /api/health             - Verificar se API está online
```

---

## 🚀 **COMO USAR:**

### **1. Iniciar a API:**

```bash
# Opção 1: Script automático
start-api.bat

# Opção 2: Manual
node api-server.js
```

**API estará em:** `http://localhost:3000`

---

### **2. Testar a API:**

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@samapeop.com","senha":"admin123"}'
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Listar Clientes (com token):**
```bash
curl http://localhost:3000/api/clientes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

### **3. Usar no App Mobile:**

O app mobile agora usa automaticamente a API!

**Como funciona:**
1. Usuário faz login no app
2. App chama `API.login(email, senha)`
3. API retorna token JWT
4. Token é salvo no localStorage
5. Todas as requisições usam o token
6. Dados vêm do PostgreSQL (Railway)

---

## 🔐 **AUTENTICAÇÃO:**

### **JWT (JSON Web Token):**

**Login:**
```javascript
const result = await API.login('admin@samapeop.com', 'admin123');
// result.token é salvo automaticamente
```

**Requisições Autenticadas:**
```javascript
// O token é enviado automaticamente nos headers
const clientes = await API.getClientes();
```

**Logout:**
```javascript
API.logout(); // Remove o token
```

---

## 📱 **APP MOBILE ATUALIZADO:**

### **Antes:**
```
App Mobile → localStorage (dados locais)
```

### **Depois:**
```
App Mobile → API REST → PostgreSQL (Railway)
```

**Vantagens:**
- ✅ Dados sincronizados em tempo real
- ✅ Múltiplos usuários podem acessar
- ✅ Dados seguros no servidor
- ✅ Backup automático
- ✅ Funciona em qualquer dispositivo

---

## 🔧 **CONFIGURAÇÃO:**

### **Arquivo `.env`:**
```env
DATABASE_URL=postgresql://postgres:...@shinkansen.proxy.rlwy.net:47179/railway
JWT_SECRET=samapeop-secret-key-2026-indio
PORT=3000
```

### **API Client (`www/api-client.js`):**
```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api', // Desenvolvimento
  // BASE_URL: 'https://seu-servidor.railway.app/api', // Produção
};
```

---

## 🌐 **DEPLOY EM PRODUÇÃO:**

### **Opção 1: Railway (Recomendado)**

1. **Criar conta:** https://railway.app/
2. **Novo projeto:** New Project → Deploy from GitHub
3. **Conectar repositório**
4. **Variáveis de ambiente:**
   ```
   DATABASE_URL=... (já configurado)
   JWT_SECRET=samapeop-secret-key-2026-indio
   PORT=3000
   ```
5. **Deploy automático!**

### **Opção 2: Heroku**

```bash
# Instalar Heroku CLI
# Login
heroku login

# Criar app
heroku create samapeop-api

# Configurar variáveis
heroku config:set DATABASE_URL=...
heroku config:set JWT_SECRET=...

# Deploy
git push heroku main
```

### **Opção 3: Vercel**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis no dashboard
```

---

## 📊 **MONITORAMENTO:**

### **Logs da API:**
```bash
# Ver logs em tempo real
node api-server.js

# Saída:
🚀 API SAMAPEOP rodando na porta 3000
📡 http://localhost:3000
🔗 Database: PostgreSQL (Railway)
```

### **Testar Conexão:**
```bash
curl http://localhost:3000/api/health
```

---

## 🆘 **TROUBLESHOOTING:**

### **Erro: "ECONNREFUSED"**
```
Solução: Certifique-se que a API está rodando
Comando: start-api.bat
```

### **Erro: "Unauthorized"**
```
Solução: Token expirado ou inválido
Ação: Fazer login novamente
```

### **Erro: "Database connection failed"**
```
Solução: Verificar DATABASE_URL no .env
Testar: node migrations.js
```

---

## ✅ **CHECKLIST:**

- [x] PostgreSQL criado (Railway)
- [x] Migrations executadas (10 tabelas)
- [x] API REST criada (Express.js)
- [x] Autenticação JWT implementada
- [x] Cliente API para mobile criado
- [x] Apps mobile sincronizados
- [ ] **→ PRÓXIMO: Testar login no app mobile**
- [ ] Deploy da API em produção
- [ ] Atualizar URL da API no app

---

## 🎯 **PRÓXIMOS PASSOS:**

### **1. Testar no Mobile:**
```
1. Certifique-se que a API está rodando (start-api.bat)
2. Compile o APK Android
3. Instale no celular
4. Faça login: admin@samapeop.com / admin123
5. Teste as funcionalidades
```

### **2. Deploy da API:**
```
1. Criar conta na Railway
2. Deploy do api-server.js
3. Anotar URL da API
4. Atualizar www/api-client.js com a URL
5. Recompilar app mobile
```

### **3. Adicionar Dados de Teste:**
```
1. Criar clientes via API
2. Criar máquinas
3. Criar ordens de serviço
4. Testar PDF
```

---

**Criado em:** 09/02/2026  
**Status:** ✅ API Funcionando  
**Banco:** PostgreSQL (Railway)  
**Auth:** JWT  
**Mobile:** Integrado
