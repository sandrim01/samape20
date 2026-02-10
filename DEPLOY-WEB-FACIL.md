# 🚀 DEPLOY NA RAILWAY - MÉTODO SUPER FÁCIL (SEM CLI)

## ⚠️ O Railway CLI teve problemas para instalar.

**Solução:** Vamos usar a interface web da Railway (mais fácil!)

---

## 📋 PASSO A PASSO (10 MINUTOS)

### **1. Criar Conta na Railway**

1. Abra: https://railway.app/
2. Clique em "Login"
3. Escolha "Login with GitHub"
4. Autorize Railway

---

### **2. Criar Novo Projeto**

1. No dashboard, clique em **"New Project"**
2. Selecione **"Empty Project"**
3. Dê um nome: `samapeop-api`

---

### **3. Adicionar Serviço**

1. Dentro do projeto, clique em **"+ New"**
2. Selecione **"Empty Service"**
3. Nome do serviço: `api`

---

### **4. Fazer Upload dos Arquivos**

**Opção A - Via GitHub (Recomendado):**

1. Crie um repositório no GitHub
2. Faça upload da pasta `api-deploy`
3. Na Railway:
   - Clique no serviço `api`
   - Settings → Connect Repo
   - Selecione seu repositório
   - Deploy automático!

**Opção B - Via Railway Dashboard:**

1. Clique no serviço `api`
2. Settings → Source
3. Faça upload dos arquivos:
   - api-server.js
   - package.json
   - .env
   - Procfile

---

### **5. Configurar Variáveis de Ambiente**

1. Clique no serviço `api`
2. Vá em **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione uma por uma:

```
Nome: DATABASE_URL
Valor: postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway
```

```
Nome: JWT_SECRET
Valor: samapeop-secret-key-2026-indio
```

```
Nome: PORT
Valor: 3000
```

5. Clique em **"Add"** para cada uma

---

### **6. Fazer Deploy**

1. Após adicionar as variáveis, Railway faz deploy automático
2. Aguarde 2-5 minutos
3. Veja os logs em **"Deployments"**

---

### **7. Gerar Domínio Público**

1. Clique no serviço `api`
2. Vá em **"Settings"**
3. Role até **"Networking"**
4. Clique em **"Generate Domain"**
5. **COPIE A URL GERADA!**

Exemplo: `https://samapeop-api-production.up.railway.app`

---

### **8. Testar a API**

Abra no navegador:
```
https://SUA-URL/api/health
```

Deve retornar:
```json
{"success":true,"message":"API SAMAPEOP funcionando!"}
```

---

### **9. Atualizar App Mobile**

1. Abra: `www/api-client.js`
2. Linha 4, altere para:
```javascript
BASE_URL: 'https://SUA-URL-DA-RAILWAY/api',
```

3. Salve o arquivo

---

### **10. Recompilar App**

```bash
npx cap sync
build-android.bat
```

---

### **11. Instalar e Testar**

1. Copie o novo APK para o celular
2. Desinstale o app antigo
3. Instale o novo APK
4. Faça login: admin@samapeop.com / admin123
5. **Agora funciona de qualquer lugar!** 🎉

---

## 📊 RESUMO VISUAL

```
1. Railway.app → Login
         ↓
2. New Project → Empty Project
         ↓
3. + New → Empty Service
         ↓
4. Upload arquivos (api-deploy/)
         ↓
5. Variables → Adicionar 3 variáveis
         ↓
6. Deploy automático (aguarde)
         ↓
7. Settings → Generate Domain
         ↓
8. Copiar URL
         ↓
9. Atualizar api-client.js
         ↓
10. Recompilar APK
         ↓
✅ PRONTO!
```

---

## 🎯 ALTERNATIVA AINDA MAIS FÁCIL

Se preferir, posso te ajudar a criar um repositório GitHub primeiro.

**Passos:**
1. Crie um repositório no GitHub
2. Faça upload da pasta `api-deploy`
3. Na Railway, conecte o repositório
4. Deploy automático!

---

## 📁 ARQUIVOS PARA UPLOAD

Todos estão na pasta: `api-deploy/`

```
✅ api-server.js
✅ package.json
✅ .env
✅ Procfile
✅ .gitignore
✅ README.md
```

---

## 🆘 PRECISA DE AJUDA?

Me avise em qual passo você está e eu te ajudo!

**Tempo estimado:** 10-15 minutos  
**Custo:** R$ 0,00 (grátis)  
**Dificuldade:** ⭐⭐ (Fácil)

---

**IMPORTANTE:** Não esqueça de copiar a URL gerada e atualizar no `api-client.js`!
