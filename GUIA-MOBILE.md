# 📱 GUIA COMPLETO - APPS MOBILE SAMAPE ÍNDIO

## ✅ STATUS ATUAL

### **Projetos Criados:**
- ✅ **Android** - Pasta `android/`
- ✅ **iOS** - Pasta `ios/`
- ✅ **Web** - Pasta `www/`

---

## 📱 ANDROID - GERAR APK

### **Pré-requisitos:**
1. **Android Studio** instalado
   - Download: https://developer.android.com/studio
   - Instalar com configurações padrão
   - Aceitar licenças do SDK

### **Opção 1: Abrir no Android Studio (Recomendado)**

```bash
# 1. Abrir o projeto Android
npx cap open android
```

**No Android Studio:**
1. Aguarde o Gradle sincronizar (primeira vez demora ~10 min)
2. Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Aguarde a compilação
4. APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### **Opção 2: Linha de Comando**

```bash
# Navegar para pasta android
cd android

# Compilar APK de debug (para testes)
gradlew assembleDebug

# OU compilar APK de release (para distribuição)
gradlew assembleRelease

# APK estará em:
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### **Instalar no Celular:**

**Via USB:**
```bash
# Habilitar "Depuração USB" no celular
# Conectar via USB
# Executar:
npx cap run android
```

**Via Arquivo APK:**
1. Copie o APK para o celular (WhatsApp, Drive, etc)
2. No celular, abra o arquivo
3. Permita "Instalar de fontes desconhecidas"
4. Instale o app

---

## 🍎 iOS - GERAR IPA

### **Pré-requisitos:**
⚠️ **ATENÇÃO:** iOS requer Mac!

1. **Mac** com macOS
2. **Xcode** instalado (App Store)
3. **Conta Apple Developer** ($99/ano)

### **Passos:**

```bash
# 1. Abrir projeto no Xcode (no Mac)
npx cap open ios
```

**No Xcode:**
1. Selecione um time de desenvolvimento
2. Configure o Bundle ID: `com.samapeindio.app`
3. Conecte um iPhone ou use simulador
4. Menu: **Product** → **Archive**
5. Distribua via TestFlight ou Ad-Hoc

---

## 🔄 ATUALIZAR CÓDIGO

Sempre que modificar HTML/CSS/JS:

```bash
# 1. Copiar arquivos para www
copy index.html www\
copy styles.css www\
copy app.js www\
copy os-modal.js www\
xcopy resources www\resources\ /E /I /Y

# 2. Sincronizar com apps nativos
npx cap sync

# 3. Recompilar Android/iOS
```

---

## 📦 PUBLICAR NAS LOJAS

### **Google Play Store:**

**Custos:**
- Taxa única: $25

**Passos:**
1. Criar conta Google Play Console
2. Criar novo app
3. Gerar APK assinado (release)
4. Upload do APK
5. Preencher informações da loja
6. Enviar para revisão

**Gerar APK Assinado:**
```bash
# No Android Studio:
# Build → Generate Signed Bundle / APK
# Criar keystore (guardar bem!)
# Gerar APK release assinado
```

### **Apple App Store:**

**Custos:**
- Taxa anual: $99

**Passos:**
1. Conta Apple Developer
2. App Store Connect
3. Criar novo app
4. Archive no Xcode
5. Upload via Xcode
6. Preencher informações
7. Enviar para revisão

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Ver versão do Capacitor
npx cap --version

# Listar plataformas instaladas
npx cap ls

# Atualizar Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest @capacitor/ios@latest

# Limpar e reconstruir
npx cap sync
npx cap copy

# Abrir projetos
npx cap open android
npx cap open ios

# Executar no dispositivo
npx cap run android
npx cap run ios
```

---

## 📱 TESTAR LOCALMENTE

### **Android:**
```bash
# Instalar no celular conectado via USB
npx cap run android

# OU usar emulador
# 1. Abrir Android Studio
# 2. AVD Manager → Create Virtual Device
# 3. npx cap run android
```

### **iOS (Mac):**
```bash
# Usar simulador
npx cap run ios

# OU dispositivo real
# Conectar iPhone via USB
# Confiar no computador
# npx cap run ios
```

---

## 🐛 PROBLEMAS COMUNS

### **Android Studio não abre:**
```bash
# Verificar JAVA_HOME
echo %JAVA_HOME%

# Instalar JDK 11 ou 17
# Configurar variável de ambiente
```

### **Gradle falha:**
```bash
# Limpar cache
cd android
gradlew clean

# Atualizar Gradle
# Editar android/gradle/wrapper/gradle-wrapper.properties
```

### **App não abre no celular:**
- Verificar permissões de "fontes desconhecidas"
- Verificar logs: `npx cap run android --livereload`

---

## 📊 ESTRUTURA DO PROJETO

```
SAMAPEOP/
├── www/                    # Arquivos web (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── os-modal.js
│   ├── manifest.json
│   └── resources/
│
├── android/                # Projeto Android nativo
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/   # APKs gerados aqui
│   └── build.gradle
│
├── ios/                    # Projeto iOS nativo
│   ├── App/
│   │   └── App.xcodeproj
│   └── Podfile
│
└── capacitor.config.json   # Configuração do Capacitor
```

---

## ✅ CHECKLIST PARA PUBLICAÇÃO

### **Antes de Publicar:**
- [ ] Testar todas as funcionalidades
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar offline (se aplicável)
- [ ] Preparar screenshots (5-8 imagens)
- [ ] Escrever descrição da loja
- [ ] Definir ícone e splash screen
- [ ] Configurar permissões necessárias
- [ ] Testar em dispositivos reais
- [ ] Gerar APK/IPA assinado
- [ ] Preparar política de privacidade

### **Informações Necessárias:**
- Nome do app: **SAMAPE ÍNDIO**
- Descrição curta
- Descrição longa
- Categoria: Produtividade / Negócios
- Classificação etária: Livre
- Screenshots (mínimo 2)
- Ícone 512x512px
- Banner (opcional)

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar APK Android** no celular
2. **Ajustar layout** para mobile se necessário
3. **Gerar APK release** assinado
4. **Publicar na Play Store** ($25)
5. **iOS** (quando tiver Mac)

---

## 📞 SUPORTE

**Documentação Oficial:**
- Capacitor: https://capacitorjs.com/docs
- Android: https://developer.android.com
- iOS: https://developer.apple.com

**Comunidade:**
- Stack Overflow
- GitHub Issues
- Fóruns Capacitor

---

**Criado em:** 09/02/2026
**Versão:** 1.0
**App ID:** com.samapeindio.app
