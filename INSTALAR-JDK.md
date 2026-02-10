# 📦 GUIA DE INSTALAÇÃO DO JDK PARA ANDROID

## ❌ Problema Detectado
O Java Development Kit (JDK) não está instalado no sistema, o que é necessário para compilar aplicativos Android.

---

## ✅ SOLUÇÃO: Instalar JDK 17

### **Passo 1: Download do JDK**

Escolha uma das opções abaixo:

#### **Opção A: Oracle JDK 17 (Recomendado)**
1. Acesse: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
2. Baixe: **Windows x64 Installer** (jdk-17_windows-x64_bin.exe)
3. Execute o instalador
4. Anote o caminho de instalação (geralmente: `C:\Program Files\Java\jdk-17`)

#### **Opção B: OpenJDK 17 (Gratuito)**
1. Acesse: https://adoptium.net/
2. Escolha: **Temurin 17 (LTS)**
3. Baixe: **Windows x64 .msi**
4. Execute o instalador
5. **IMPORTANTE:** Marque a opção "Set JAVA_HOME variable"

---

### **Passo 2: Configurar Variáveis de Ambiente**

#### **Método 1: Automático (se instalou OpenJDK com a opção marcada)**
✅ Já está configurado! Pule para o Passo 3.

#### **Método 2: Manual**

1. **Abrir Configurações de Variáveis de Ambiente:**
   - Pressione `Win + R`
   - Digite: `sysdm.cpl`
   - Clique em "Variáveis de Ambiente"

2. **Criar JAVA_HOME:**
   - Em "Variáveis do Sistema", clique em "Novo"
   - Nome: `JAVA_HOME`
   - Valor: `C:\Program Files\Java\jdk-17` (ou o caminho onde instalou)
   - Clique em "OK"

3. **Atualizar PATH:**
   - Em "Variáveis do Sistema", selecione "Path"
   - Clique em "Editar"
   - Clique em "Novo"
   - Adicione: `%JAVA_HOME%\bin`
   - Clique em "OK" em todas as janelas

---

### **Passo 3: Verificar Instalação**

Abra um **NOVO** terminal PowerShell ou CMD e execute:

```bash
java -version
```

**Resultado esperado:**
```
java version "17.0.x"
Java(TM) SE Runtime Environment (build 17.0.x+xx)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.x+xx, mixed mode)
```

---

### **Passo 4: Verificar JAVA_HOME**

```bash
echo %JAVA_HOME%
```

**Resultado esperado:**
```
C:\Program Files\Java\jdk-17
```

---

## 🔧 APÓS INSTALAR O JDK

### **1. Compilar o APK Android**

```bash
cd c:\Users\aless\Documents\APPS\SAMAPEOP
cmd /c "cd android && gradlew assembleDebug"
```

### **2. Localizar o APK**

O APK será gerado em:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### **3. Instalar no Celular**

**Opção A: Via USB**
1. Ative "Depuração USB" no celular (Configurações → Sobre o telefone → Toque 7x em "Número da versão" → Opções do desenvolvedor → Depuração USB)
2. Conecte o celular no PC
3. Execute:
```bash
cmd /c "cd android && gradlew installDebug"
```

**Opção B: Transferir APK**
1. Copie o arquivo `app-debug.apk` para o celular
2. No celular, abra o arquivo e instale
3. Permita "Instalar de fontes desconhecidas" se solicitado

---

## 🎯 RESUMO RÁPIDO

1. ✅ Baixar JDK 17: https://adoptium.net/
2. ✅ Instalar (marcar "Set JAVA_HOME")
3. ✅ Abrir NOVO terminal
4. ✅ Testar: `java -version`
5. ✅ Compilar: `cd android && gradlew assembleDebug`
6. ✅ Instalar APK no celular

---

## ❓ PROBLEMAS COMUNS

### **"java não é reconhecido"**
- Feche TODOS os terminais e abra um novo
- Verifique se JAVA_HOME está configurado: `echo %JAVA_HOME%`
- Verifique se %JAVA_HOME%\bin está no PATH

### **"JAVA_HOME is not set"**
- Configure manualmente seguindo o Passo 2 - Método 2

### **Gradle falha ao compilar**
- Verifique se tem internet (Gradle baixa dependências)
- Execute: `cd android && gradlew clean`
- Tente novamente: `gradlew assembleDebug`

---

## 📞 PRÓXIMOS PASSOS

Após instalar o JDK e compilar o APK:

1. ✅ Instalar o app no celular
2. ✅ Testar login com:
   - Email: `admin@samapeop.com`
   - Senha: `admin123`
3. ✅ Verificar se conecta na API: `https://samape20-estudioio.up.railway.app/api`

---

**🎉 Boa sorte!**
