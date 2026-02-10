# ⚠️ JAVA NÃO ENCONTRADO

Para compilar o APK Android, você precisa instalar o Java JDK.

## 🔧 SOLUÇÃO RÁPIDA

### **Opção 1: Usar Android Studio (RECOMENDADO)**

Android Studio já vem com Java embutido!

1. **Baixar Android Studio:**
   - https://developer.android.com/studio
   - Instalar com configurações padrão

2. **Abrir o projeto:**
   ```
   Clique duas vezes em: build-android.bat
   ```
   
3. **No Android Studio:**
   - Aguarde sincronização do Gradle (10-15 min na primeira vez)
   - Menu: **Build** → **Build Bundle/APK** → **Build APK**
   - APK gerado em: `android\app\build\outputs\apk\debug\app-debug.apk`

---

### **Opção 2: Instalar Java Manualmente**

1. **Baixar Java JDK 17:**
   - https://adoptium.net/
   - Baixar: "Temurin 17 (LTS)"
   - Instalar

2. **Configurar JAVA_HOME:**
   ```
   1. Painel de Controle → Sistema → Configurações avançadas
   2. Variáveis de Ambiente
   3. Nova variável de sistema:
      Nome: JAVA_HOME
      Valor: C:\Program Files\Eclipse Adoptium\jdk-17.x.x
   4. Adicionar ao PATH: %JAVA_HOME%\bin
   ```

3. **Compilar:**
   ```bash
   cd android
   gradlew.bat assembleDebug
   ```

---

## 🚀 MÉTODO MAIS FÁCIL

**Use Android Studio!** Ele:
- ✅ Já vem com Java
- ✅ Configura tudo automaticamente
- ✅ Interface visual
- ✅ Mais fácil para iniciantes

**Download:** https://developer.android.com/studio

---

## 📱 DEPOIS DE INSTALAR ANDROID STUDIO

Execute:
```
build-android.bat
```

Ou manualmente:
```bash
npx cap open android
```

No Android Studio:
1. Aguarde sincronização
2. Build → Build APK
3. APK estará em: android\app\build\outputs\apk\debug\

---

## ✅ CHECKLIST

- [ ] Android Studio instalado
- [ ] Projeto aberto no Android Studio
- [ ] Gradle sincronizado
- [ ] Build → Build APK
- [ ] APK gerado com sucesso

---

**Tempo estimado:** 30-45 minutos (incluindo download e instalação)
