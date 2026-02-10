# 🚀 DEPLOY DA API NA RAILWAY - GUIA COMPLETO

## 📋 **POR QUE FAZER DEPLOY?**

**Problema Atual:**
- ❌ API rodando apenas no seu PC (localhost)
- ❌ Celular só acessa se estiver na mesma WiFi
- ❌ Não funciona de qualquer lugar

**Solução: Deploy na Railway**
- ✅ API disponível 24/7 na internet
- ✅ Funciona de qualquer lugar do mundo
- ✅ Mesmo servidor do banco PostgreSQL
- ✅ HTTPS automático (seguro)
- ✅ **GRÁTIS** (plano gratuito)

---

## 🌐 **OPÇÃO 1: DEPLOY NA RAILWAY (Recomendado)**

### **Passo 1: Criar Conta na Railway**

1. Acesse: https://railway.app/
2. Clique em "Start a New Project"
3. Login com GitHub (ou criar conta)

### **Passo 2: Criar Novo Projeto**

1. No dashboard, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. **OU** selecione "Empty Project"

### **Passo 3: Fazer Deploy**

**Opção A - Via GitHub (Recomendado):**

```bash
# 1. Criar repositório no GitHub
# 2. Fazer push do código
git init
git add .
git commit -m "API SAMAPEOP"
git remote add origin https://github.com/SEU-USUARIO/samapeop-api.git
git push -u origin main

# 3. Na Railway:
# - New Project → Deploy from GitHub
# - Selecionar repositório
# - Deploy automático!
```

**Opção B - Via Railway CLI:**

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Iniciar projeto
railway init

# 4. Deploy
railway up
```

**Opção C - Upload Manual (Mais Fácil):**

1. Na Railway, crie "Empty Project"
2. Clique em "Deploy"
3. Selecione "Deploy from local directory"
4. Faça upload da pasta do projeto

### **Passo 4: Configurar Variáveis de Ambiente**

Na Railway, vá em **Variables** e adicione:

```
DATABASE_URL=postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway
JWT_SECRET=samapeop-secret-key-2026-indio
PORT=3000
```

**OBS:** O DATABASE_URL já deve estar configurado automaticamente!

### **Passo 5: Obter URL da API**

Após o deploy:
1. Railway vai gerar uma URL tipo: `https://samapeop-api-production.up.railway.app`
2. Anote essa URL!

---

## 🌐 **OPÇÃO 2: DEPLOY NO RENDER (Alternativa Grátis)**

### **Passo 1: Criar Conta**
- Acesse: https://render.com/
- Login com GitHub

### **Passo 2: Novo Web Service**
1. Dashboard → New → Web Service
2. Conectar repositório GitHub
3. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `node api-server.js`
   - **Environment:** Node

### **Passo 3: Variáveis de Ambiente**
Adicionar as mesmas variáveis da Railway

### **Passo 4: Deploy**
- Clique em "Create Web Service"
- Aguarde deploy (5-10 min)
- URL gerada: `https://samapeop-api.onrender.com`

---

## 🌐 **OPÇÃO 3: DEPLOY NO VERCEL (Serverless)**

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variáveis
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add PORT

# 5. Deploy produção
vercel --prod
```

---

## 📱 **ATUALIZAR APP MOBILE COM URL DA API**

Depois de fazer o deploy, você terá uma URL tipo:
```
https://samapeop-api-production.up.railway.app
```

### **Atualizar www/api-client.js:**

```javascript
const API_CONFIG = {
  // URL da API em produção
  BASE_URL: 'https://samapeop-api-production.up.railway.app/api',
  // Substitua pela URL que a Railway gerou
```

### **Sincronizar e Recompilar:**

```bash
# 1. Sincronizar
npx cap sync

# 2. Recompilar APK
build-android.bat

# 3. Instalar novo APK no celular
```

---

## ✅ **CHECKLIST DE DEPLOY**

### **Antes do Deploy:**
- [ ] Conta criada na Railway/Render/Vercel
- [ ] Código do projeto pronto
- [ ] Variáveis de ambiente anotadas

### **Durante o Deploy:**
- [ ] Projeto criado na plataforma
- [ ] Código enviado (GitHub ou upload)
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy iniciado

### **Depois do Deploy:**
- [ ] URL da API anotada
- [ ] Testar API: `https://SUA-URL/api/health`
- [ ] Atualizar `www/api-client.js`
- [ ] Sincronizar apps: `npx cap sync`
- [ ] Recompilar APK
- [ ] Testar login no celular

---

## 🧪 **TESTAR API APÓS DEPLOY**

```bash
# Health check
curl https://SUA-URL/api/health

# Login
curl -X POST https://SUA-URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@samapeop.com","senha":"admin123"}'
```

---

## 📊 **COMPARAÇÃO DE PLATAFORMAS**

| Plataforma | Grátis? | Fácil? | Uptime | Recomendado |
|------------|---------|--------|--------|-------------|
| **Railway** | ✅ Sim | ⭐⭐⭐⭐⭐ | 99.9% | ✅ **SIM** |
| **Render** | ✅ Sim | ⭐⭐⭐⭐ | 99.5% | ✅ Sim |
| **Vercel** | ✅ Sim | ⭐⭐⭐ | 99.9% | ⚠️ Serverless |
| **Heroku** | ❌ Não* | ⭐⭐⭐⭐ | 99.9% | ⚠️ Pago |

*Heroku não tem plano grátis mais

---

## 🎯 **RECOMENDAÇÃO FINAL**

### **Use Railway porque:**
1. ✅ Seu banco PostgreSQL já está lá
2. ✅ Integração perfeita
3. ✅ Deploy super fácil
4. ✅ Plano grátis generoso
5. ✅ HTTPS automático
6. ✅ Logs em tempo real

### **Passos Resumidos:**
```
1. Acesse: https://railway.app/
2. Login com GitHub
3. New Project → Empty Project
4. Add Service → Database → PostgreSQL (já existe)
5. Add Service → GitHub Repo (ou upload manual)
6. Configurar variáveis
7. Deploy!
8. Copiar URL gerada
9. Atualizar www/api-client.js
10. Recompilar app
```

---

## 📞 **PRECISA DE AJUDA?**

Se tiver dificuldade, posso:
1. ✅ Criar repositório GitHub para você
2. ✅ Fazer deploy via Railway CLI
3. ✅ Configurar tudo automaticamente

**Basta me avisar!**

---

**Criado em:** 09/02/2026  
**Objetivo:** API acessível de qualquer lugar  
**Custo:** R$ 0,00 (plano grátis)
