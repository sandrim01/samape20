# 🚀 DEPLOY NA RAILWAY - PASSO A PASSO SUPER SIMPLES

## ✅ TUDO JÁ ESTÁ PRONTO!

Criei uma pasta `api-deploy` com todos os arquivos necessários:

```
api-deploy/
├── api-server.js       ← Servidor API
├── package.json        ← Dependências
├── .env                ← Configurações
├── Procfile            ← Comando de start
├── .gitignore          ← Arquivos ignorados
└── README.md           ← Documentação
```

---

## 🎯 MÉTODO 1: UPLOAD DIRETO (MAIS FÁCIL)

### **Passo 1: Acessar Railway**
```
1. Abra: https://railway.app/
2. Clique em "Start a New Project"
3. Login com GitHub (ou criar conta grátis)
```

### **Passo 2: Criar Projeto**
```
1. No dashboard, clique "New Project"
2. Selecione "Deploy from GitHub repo"
3. OU clique "Empty Project"
```

### **Passo 3: Adicionar Serviço**
```
1. Clique "+ New"
2. Selecione "GitHub Repo"
3. Autorize Railway a acessar GitHub
4. Crie um novo repositório ou use existente
```

### **Passo 4: Upload dos Arquivos**

**Opção A - Via GitHub Desktop:**
```
1. Baixe GitHub Desktop: https://desktop.github.com/
2. File → Add Local Repository
3. Selecione a pasta: api-deploy
4. Commit → Push
5. Railway detecta e faz deploy automático
```

**Opção B - Via Git (Terminal):**
```bash
cd api-deploy

git init
git add .
git commit -m "Deploy API SAMAPEOP"

# Criar repositório no GitHub primeiro
# Depois:
git remote add origin https://github.com/SEU-USUARIO/samapeop-api.git
git push -u origin main
```

### **Passo 5: Configurar na Railway**
```
1. Railway detecta o repositório
2. Clica em "Deploy"
3. Aguarde 2-5 minutos
```

### **Passo 6: Configurar Variáveis (Importante!)**
```
1. No projeto Railway, clique em "Variables"
2. Adicione:
   
   DATABASE_URL = postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway
   
   JWT_SECRET = samapeop-secret-key-2026-indio
   
   PORT = 3000

3. Clique "Add" para cada uma
4. Railway vai fazer redeploy automático
```

### **Passo 7: Obter URL**
```
1. Após deploy, vá em "Settings"
2. Clique em "Generate Domain"
3. URL gerada será tipo:
   https://samapeop-api-production.up.railway.app
   
4. ANOTE ESSA URL!
```

---

## 🎯 MÉTODO 2: VIA RAILWAY CLI (MAIS RÁPIDO)

### **Passo 1: Instalar Railway CLI**
```bash
npm install -g @railway/cli
```

### **Passo 2: Login**
```bash
railway login
```
(Abre navegador para autenticar)

### **Passo 3: Deploy**
```bash
cd api-deploy
railway init
railway up
```

### **Passo 4: Adicionar Variáveis**
```bash
railway variables set DATABASE_URL="postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway"

railway variables set JWT_SECRET="samapeop-secret-key-2026-indio"

railway variables set PORT="3000"
```

### **Passo 5: Obter URL**
```bash
railway domain
```

---

## ✅ DEPOIS DO DEPLOY

### **1. Testar API**
```bash
# Substitua SUA-URL pela URL que a Railway gerou
curl https://SUA-URL/api/health

# Deve retornar:
{"success":true,"message":"API SAMAPEOP funcionando!"}
```

### **2. Testar Login**
```bash
curl -X POST https://SUA-URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@samapeop.com","senha":"admin123"}'
```

### **3. Atualizar App Mobile**

Edite: `www/api-client.js` (linha 4)
```javascript
BASE_URL: 'https://SUA-URL-DA-RAILWAY/api',
```

### **4. Sincronizar e Recompilar**
```bash
npx cap sync
build-android.bat
```

### **5. Instalar Novo APK**
```
1. Desinstale app antigo do celular
2. Instale novo APK
3. Faça login
4. Agora funciona de qualquer lugar! 🎉
```

---

## 🆘 PROBLEMAS COMUNS

### **Erro: "Build failed"**
```
Solução:
1. Verifique se package.json está correto
2. Verifique se api-server.js está na pasta
3. Veja os logs no Railway
```

### **Erro: "Database connection failed"**
```
Solução:
1. Verifique se DATABASE_URL está configurado
2. Teste conexão com banco
3. Verifique se IP está liberado
```

### **Erro: "Port already in use"**
```
Solução:
1. Railway usa PORT automático
2. Certifique-se que api-server.js usa process.env.PORT
```

---

## 📊 RESUMO VISUAL

```
┌─────────────────┐
│  1. Railway.app │
│  (Login)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. New Project │
│  (GitHub Repo)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Upload      │
│  (api-deploy/)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Variables   │
│  (DATABASE_URL) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Deploy!     │
│  (Aguarde)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. URL Gerada  │
│  (Copiar)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. Atualizar   │
│  (api-client.js)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  8. Recompilar  │
│  (APK)          │
└────────┬────────┘
         │
         ▼
    ✅ PRONTO!
```

---

## 🎯 QUAL MÉTODO USAR?

**Recomendo MÉTODO 2 (Railway CLI):**
- ✅ Mais rápido (5 minutos)
- ✅ Menos passos
- ✅ Mais fácil de atualizar depois

**Use MÉTODO 1 se:**
- Prefere interface visual
- Não gosta de terminal
- Quer ver tudo acontecendo

---

## 📞 PRECISA DE AJUDA?

Se travar em algum passo, me avise que eu te ajudo!

**Tempo estimado:** 10-15 minutos  
**Custo:** R$ 0,00 (grátis)  
**Dificuldade:** ⭐⭐ (Fácil)

---

**TUDO PRONTO! Agora é só seguir os passos acima!** 🚀
