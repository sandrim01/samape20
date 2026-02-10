@echo off
echo ========================================
echo COMPILAR APK ANDROID (PATCHED)
echo ========================================
echo.

REM Configurar JAVA_HOME e PATH
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/5] Verificando Java...
"%JAVA_HOME%\bin\java.exe" -version
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Java nao encontrado em: %JAVA_HOME%
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Sincronizando arquivos (Capacitor Sync)...
cd c:\Users\aless\Documents\APPS\SAMAPEOP
call npx cap sync android
echo.

echo [3/5] Aplicando Patches de Compatibilidade (Java 21 -> 17)...
echo.

REM Patch android/app/capacitor.build.gradle
powershell -Command "(get-content android/app/capacitor.build.gradle) -replace 'VERSION_21', 'VERSION_17' | set-content android/app/capacitor.build.gradle"
echo [+] Patch aplicado: android/app/capacitor.build.gradle

REM Patch android/capacitor-cordova-android-plugins/build.gradle
powershell -Command "(get-content android/capacitor-cordova-android-plugins/build.gradle) -replace 'VERSION_21', 'VERSION_17' | set-content android/capacitor-cordova-android-plugins/build.gradle"
echo [+] Patch aplicado: android/capacitor-cordova-android-plugins/build.gradle

REM Patch node_modules (caso necessario)
if exist "node_modules\@capacitor\android\capacitor\build.gradle" (
    powershell -Command "(get-content node_modules/@capacitor/android/capacitor/build.gradle) -replace 'VERSION_21', 'VERSION_17' | set-content node_modules/@capacitor/android/capacitor/build.gradle"
    echo [+] Patch aplicado: node_modules/@capacitor/android/capacitor/build.gradle
)

echo.
echo [4/5] Compilando APK Android...
echo.
cd android
call gradlew assembleDebug

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo [OK] APK COMPILADO COM SUCESSO!
    echo ========================================
    echo.
    echo [5/5] Localizando APK...
    echo.
    
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        echo APK gerado em:
        echo %CD%\app\build\outputs\apk\debug\app-debug.apk
        echo.
        echo Tamanho:
        dir "app\build\outputs\apk\debug\app-debug.apk" | findstr "app-debug.apk"
    ) else (
        echo [AVISO] APK nao encontrado no local esperado
    )
) else (
    echo.
    echo ========================================
    echo [ERRO] FALHA AO COMPILAR APK
    echo ========================================
)

cd ..
echo.
pause
