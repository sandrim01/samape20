# 📱 SAMAPE ÍNDIO - Versões Mobile

## ✅ APPS CRIADOS COM SUCESSO!

### **Plataformas Disponíveis:**
- ✅ **Android** - Pronto para compilar
- ✅ **iOS** - Pronto para compilar (requer Mac)
- ✅ **Windows** - Executável em `dist/SAMAPEOP-Portable/`

---

## 🚀 INÍCIO RÁPIDO - ANDROID

### **Opção 1: Usar Script Automático** (Recomendado)
```
1. Clique duas vezes em: build-android.bat
2. Aguarde Android Studio abrir
3. Menu: Build → Build APK
4. APK gerado em: android\app\build\outputs\apk\debug\
```

### **Opção 2: Manual**
```bash
# 1. Abrir Android Studio
npx cap open android

# 2. No Android Studio:
# Build → Build Bundle/APK → Build APK

# 3. APK estará em:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 INSTALAR NO CELULAR

### **Método 1: Via USB**
```bash
# 1. Habilitar "Depuração USB" no celular
# 2. Conectar celular via USB
# 3. Executar:
npx cap run android
```

### **Método 2: Via Arquivo APK**
```
1. Copie o APK para o celular (WhatsApp, Drive, etc)
2. Abra o arquivo no celular
3. Permita "Instalar de fontes desconhecidas"
4. Instale
```

---

## 🔄 ATUALIZAR APÓS MUDANÇAS NO CÓDIGO

```
1. Clique duas vezes em: atualizar-mobile.bat
2. Recompile no Android Studio
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Veja **GUIA-MOBILE.md** para:
- Instruções detalhadas Android/iOS
- Como publicar nas lojas
- Resolução de problemas
- Comandos avançados

---

## 📊 ESTRUTURA

```
SAMAPEOP/
├── www/                    # Arquivos web
├── android/                # Projeto Android
├── ios/                    # Projeto iOS
├── build-android.bat       # Script para compilar Android
├── atualizar-mobile.bat    # Script para atualizar apps
└── GUIA-MOBILE.md          # Documentação completa
```

---

## ⚠️ PRÉ-REQUISITOS

### **Para Android:**
- Android Studio instalado
- Java JDK 11 ou 17

### **Para iOS:**
- Mac com macOS
- Xcode instalado
- Conta Apple Developer ($99/ano)

---

## 💰 CUSTOS

| Plataforma | Custo | Frequência |
|------------|-------|------------|
| **Android (Play Store)** | $25 | Uma vez |
| **iOS (App Store)** | $99 | Por ano |
| **Distribuição direta (APK)** | Grátis | - |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Instalar Android Studio
2. ✅ Executar `build-android.bat`
3. ✅ Compilar APK
4. ✅ Testar no celular
5. ⏳ Publicar na Play Store (opcional)

---

**App ID:** com.samapeindio.app  
**Versão:** 1.0  
**Criado:** 09/02/2026
