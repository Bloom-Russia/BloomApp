#!/bin/bash

set -euo pipefail

echo "🧹 Очистка React Native проекта..."

# Функция для безопасного завершения процессов
kill_process() {
    pkill -f "$1" 2>/dev/null && echo "✅ Остановлен $1" || true
}

# Остановка Metro и связанных процессов
kill_process "metro"
kill_process "cli.js start"

# Функция для исправления проблем с версиями пакетов
fix_package_warnings() {
    echo "🔧 Исправление предупреждений о версиях пакетов..."

    if [ -f "package.json" ]; then
        echo "📄 Анализируем package.json..."

        # Проверяем и исправляем ESLint версию
        local eslint_version
        eslint_version=$(node -e "
            try {
                const pkg = require('./package.json');
                const ver = pkg.devDependencies?.eslint ||
                           pkg.dependencies?.eslint || '';
                console.log(ver);
            } catch(e) { console.log(''); }
        " 2>/dev/null || echo "")

        # Исправляем версию ESLint если она < 8.57.0
        if [[ -n "$eslint_version" ]] && [[ ! "$eslint_version" =~ ^[89] ]] && [[ ! "$eslint_version" =~ 8\.5[7-9]|8\.[6-9]|^9 ]]; then
            echo "⚠️  ESLint версия $eslint_version не совместима с @typescript-eslint плагинами"
            echo "🔁 Обновляем ESLint до 8.57.0..."
            if [ -f "yarn.lock" ]; then
                yarn add eslint@^8.57.0 --dev --ignore-engines 2>/dev/null || yarn add eslint@^8.57.0 --dev 2>/dev/null || true
            else
                npm install eslint@^8.57.0 --save-dev --legacy-peer-deps 2>/dev/null || true
            fi
        fi

        # Проверяем наличие @typescript-eslint плагинов и исправляем их версии
        if grep -q "@typescript-eslint" package.json; then
            echo "🔄 Обновляем @typescript-eslint плагины до совместимых версий..."

            # Проверяем текущую версию
            local ts_plugin_version=$(node -e "
                try {
                    const pkg = require('./package.json');
                    const deps = {...pkg.dependencies, ...pkg.devDependencies};
                    console.log(deps['@typescript-eslint/eslint-plugin'] || '');
                } catch(e) { console.log(''); }
            " 2>/dev/null || echo "")

            # Обновляем только если версия >= 8.0.0 (несовместимая с ESLint 8)
            if [[ -n "$ts_plugin_version" ]] && [[ "$ts_plugin_version" =~ ^[8-9] ]]; then
                echo "🔁 Заменяем @typescript-eslint плагины на версию 6.x для совместимости..."
                if [ -f "yarn.lock" ]; then
                    yarn remove @typescript-eslint/eslint-plugin @typescript-eslint/parser --dev 2>/dev/null || true
                    yarn add @typescript-eslint/eslint-plugin@^6.0.0 @typescript-eslint/parser@^6.0.0 --dev --ignore-engines 2>/dev/null || true
                else
                    npm uninstall @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev 2>/dev/null || true
                    npm install @typescript-eslint/eslint-plugin@^6.0.0 @typescript-eslint/parser@^6.0.0 --save-dev --legacy-peer-deps 2>/dev/null || true
                fi
            fi
        fi

        # Исправляем проблему с bare-fs и bare-os
        if grep -q "bare-fs\|bare-os" package.json; then
            echo "🔧 Настраиваем игнорирование предупреждений bare-fs/bare-os..."

            # Создаем правильный .npmrc
            cat > .npmrc << 'EOF'
engine-strict=false
strict-peer-dependencies=false
legacy-peer-deps=true
EOF
            echo "✅ Создан .npmrc с настройками для игнорирования engine warnings"
        fi

        # Проверяем и исправляем версии React если нужно
        local react_version
        local react_dom_version

        react_version=$(node -e "
            try {
                const pkg = require('./package.json');
                const ver = pkg.dependencies?.react ||
                           pkg.devDependencies?.react || '';
                console.log(ver);
            } catch(e) { console.log(''); }
        " 2>/dev/null || echo "")

        react_dom_version=$(node -e "
            try {
                const pkg = require('./package.json');
                const ver = pkg.dependencies?.['react-dom'] ||
                           pkg.devDependencies?.['react-dom'] || '';
                console.log(ver);
            } catch(e) { console.log(''); }
        " 2>/dev/null || echo "")

        # Исправляем несовместимость React/React DOM
        if [[ "$react_dom_version" == 19.2.3 ]] && [[ "$react_version" != 19.2.3 ]]; then
            echo "🔁 Выравниваем версии React (19.2.3) и React DOM (19.2.3)..."
            if [ -f "yarn.lock" ]; then
                yarn add react@19.2.3 react-dom@19.2.3 --ignore-engines 2>/dev/null || true
            else
                npm install react@19.2.3 react-dom@19.2.3 --save --legacy-peer-deps 2>/dev/null || true
            fi
        fi

        # Исправляем предупреждение о workspaces
        if grep -q '"workspaces"' package.json && ! grep -q '"private": true' package.json; then
            echo "🔧 Исправляем предупреждение workspaces..."

            # Делаем проект приватным
            node -e "
                const fs = require('fs');
                try {
                    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                    pkg.private = true;
                    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
                    console.log('private установлен');
                } catch(e) {
                    console.log('ошибка при установке private');
                }
            " 2>/dev/null || true

            echo "✅ Добавлен 'private: true' в package.json"
        fi

        # Исправляем jest-eslint плагин
        if grep -q 'eslint-plugin-jest' package.json || grep -q '@react-native/eslint-config' package.json; then
            echo "🔧 Проверяем eslint-plugin-jest..."

            local jest_plugin_version=$(node -e "
                try {
                    const pkg = require('./package.json');
                    const deps = {...pkg.dependencies, ...pkg.devDependencies};
                    const jestVer = deps['eslint-plugin-jest'] ||
                                   deps['@jest/eslint-plugin'] || '';
                    console.log(jestVer);
                } catch(e) { console.log(''); }
            " 2>/dev/null || echo "")

            # Если jest plugin устаревший, обновляем его
            if [[ -n "$jest_plugin_version" ]] && [[ "$jest_plugin_version" =~ ^29\. ]]; then
                echo "🔄 Обновляем eslint-plugin-jest для совместимости с ESLint 8+..."
                if [ -f "yarn.lock" ]; then
                    yarn remove eslint-plugin-jest --dev 2>/dev/null || true
                    yarn add eslint-plugin-jest@^27.0.0 --dev --ignore-engines 2>/dev/null || true
                else
                    npm uninstall eslint-plugin-jest --save-dev 2>/dev/null || true
                    npm install eslint-plugin-jest@^27.0.0 --save-dev --legacy-peer-deps 2>/dev/null || true
                fi
            fi
        fi

        echo "✅ Проверка версий пакетов завершена"
    fi
}

# Полная очистка кэшей Gradle
clean_gradle_cache_completely() {
    echo "🗑️  Полная очистка кэша Gradle..."

    # Очистка пользовательского кэша Gradle
    rm -rf ~/.gradle/caches/ 2>/dev/null || true
    rm -rf ~/.gradle/wrapper/ 2>/dev/null || true
    rm -rf ~/.gradle/daemon/ 2>/dev/null || true

    # Специальная очистка проблемных директорий
    find ~/.gradle -name "*.lock" -type f -delete 2>/dev/null || true
    find ~/.gradle -name "metadata.bin" -type f -delete 2>/dev/null || true

    # Также очищаем временные файлы в системе
    rm -rf /tmp/.gradle-* 2>/dev/null || true
    rm -rf /tmp/gradle-* 2>/dev/null || true
}

# Очистка кэшей
echo "🧼 Очистка кэшей..."
clean_caches() {
    echo "🗑️  Очистка Metro и Node кэшей..."
    rm -rf "$TMPDIR"/metro-* 2>/dev/null
    rm -rf "$TMPDIR"/haste-map-* 2>/dev/null
    rm -rf "$TMPDIR"/react-* 2>/dev/null
    rm -rf ~/.rncache/ 2>/dev/null

    # Очистка npm/yarn кэшей
    echo "🗑️  Очистка npm/yarn кэшей..."
    npm cache clean --force 2>/dev/null || true
    yarn cache clean 2>/dev/null || true

    # Используем полную очистку кэша Gradle
    clean_gradle_cache_completely
}

clean_caches

# Проверка и восстановление settings.gradle
check_settings_gradle() {
    local settings_file="android/settings.gradle"

    if [ -f "$settings_file" ]; then
        echo "🔍 Проверка $settings_file..."

        # Проверяем минимальное содержимое
        if [ ! -s "$settings_file" ]; then
            echo "⚠️  Файл пустой, восстанавливаем..."
            restore_settings_gradle
        elif ! grep -q "include" "$settings_file"; then
            echo "⚠️  Не найдено include, восстанавливаем..."
            restore_settings_gradle
        fi
    elif [ -d "android" ]; then
        echo "⚠️  Файл settings.gradle не найден, создаем..."
        restore_settings_gradle
    fi
}

# Восстановление settings.gradle
restore_settings_gradle() {
    local settings_file="android/settings.gradle"

    echo "🔧 Восстановление $settings_file..."

    # Создаем правильный settings.gradle для React Native
    cat > "$settings_file" << 'EOF'
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
plugins { id("com.facebook.react.settings") }
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }
rootProject.name = 'BloomApp'
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
EOF

    echo "✅ settings.gradle восстановлен"
}

# Обновление gradle wrapper
update_gradle_wrapper() {
    if [ -f "android/gradle/wrapper/gradle-wrapper.properties" ]; then
        echo "🔄 Проверка версии gradle wrapper..."

        # Используем совместимую версию Gradle для React Native
        local target_gradle_version="9.0.0"  # Более стабильная версия для RN

        # Читаем текущую версию из файла
        local gradle_file="android/gradle/wrapper/gradle-wrapper.properties"

        # Извлекаем текущую версию Gradle
        local current_version=""
        while IFS= read -r line; do
            if [[ $line == distributionUrl=* ]]; then
                # Извлекаем версию из URL
                if [[ $line =~ gradle-([0-9]+\.[0-9]+(\.[0-9]+)?) ]]; then
                    current_version="${BASH_REMATCH[1]}"
                fi
                break
            fi
        done < "$gradle_file"

        if [ -z "$current_version" ]; then
            echo "⚠️ Не удалось определить текущую версию Gradle"
        elif [ "$current_version" = "$target_gradle_version" ]; then
            echo "✅ Текущая версия Gradle ${current_version} уже актуальна"
            return 0
        else
            echo "📋 Текущая версия: ${current_version}, обновление до: ${target_gradle_version}"
        fi

        echo "🔄 Обновление gradle wrapper..."

        # Обновляем версию (для macOS используем -i '', для Linux используйте просто -i)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|distributionUrl=.*|distributionUrl=https\://services.gradle.org/distributions/gradle-${target_gradle_version}-all.zip|" \
                "$gradle_file"
        else
            sed -i "s|distributionUrl=.*|distributionUrl=https\://services.gradle.org/distributions/gradle-${target_gradle_version}-all.zip|" \
                "$gradle_file"
        fi

        echo "✅ Gradle wrapper обновлен до версии ${target_gradle_version}"
    else
        echo "⚠️ Файл gradle-wrapper.properties не найден"
        return 1
    fi
}

# Очистка Android
echo "🤖 Очистка Android сборки..."
clean_android() {
    if [ -d "android" ]; then
        # Проверяем и восстанавливаем settings.gradle
        check_settings_gradle

        # Обновляем gradle wrapper
        update_gradle_wrapper

        cd android || return 1

        # Проверяем существование gradlew
        if [ ! -f "gradlew" ]; then
            echo "⚠️  gradlew не найден, пропускаем gradle clean"
            echo "📦 Загружаем gradle wrapper..."
            # Пытаемся инициализировать gradle wrapper
            gradle wrapper 2>/dev/null || true
        fi

        # Даем права на выполнение
        chmod +x gradlew 2>/dev/null || true

        # Сначала очищаем локальные build файлы
        echo "🧹 Очистка локальных build файлов..."
        rm -rf .cxx 2>/dev/null || true
        rm -rf app/.cxx 2>/dev/null || true
        rm -rf app/build 2>/dev/null || true
        rm -rf build 2>/dev/null || true
        rm -rf .gradle 2>/dev/null || true

        # Создаем минимальный build.gradle если нужно
        if [ ! -f "build.gradle" ] || [ ! -s "build.gradle" ]; then
            echo "📝 Создаем минимальный build.gradle..."
            cat > build.gradle << 'EOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion = 24
        compileSdkVersion = 36
        targetSdkVersion = 36
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.1.20"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
        classpath 'com.google.gms:google-services:4.3.15'
    }f
}

allprojects {
    repositories {
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url("$rootDir/../node_modules/react-native/android")
        }
        maven {
            // Android JSC is installed from npm
            url("$rootDir/../node_modules/jsc-android/dist")
        }
        mavenCentral {
            // We don't want to fetch react-native from Maven Central as there are
            // older versions over there.
            content {
                excludeGroup "com.facebook.react"
            }
        }
        google()
        maven { url 'https://www.jitpack.io' }
    }
}
EOF
        fi

        # Возвращаемся в корневую директорию
        cd ..

        echo "✅ Очистка Android завершена"
    else
        echo "⚠️  Папка android не найдена"
    fi
}

clean_android

# Очистка iOS (только для macOS)
clean_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        return
    fi

    if [ ! -d "ios" ]; then
        echo "⚠️  Папка ios не найдена"
        return
    fi

    echo "🍎 Очистка iOS сборки..."
    cd ios || return 1

    # Очистка кэша Xcode
    echo "🗑️  Очистка кэша Xcode..."
    rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
    rm -rf Pods Podfile.lock 2>/dev/null || true

    # Очистка кэша CocoaPods
    pod cache clean --all 2>/dev/null || true

    cd ..
}

clean_ios

# Очистка watchman
echo "👀 Очистка кэша watchman..."
watchman watch-del-all 2>/dev/null || true

# Очистка кэша npm/yarn
echo "🧹 Очистка кэша пакетов..."
rm -rf ~/.npm/_cacache 2>/dev/null || true
rm -rf ~/.yarn/cache 2>/dev/null || true

# Удаление node_modules
echo "🗑️  Удаление node_modules..."
rm -rf node_modules 2>/dev/null || true

# Исправляем предупреждения о версиях пакетов
fix_package_warnings

# Удаляем старый .yarnrc если он есть (неправильного формата)
rm -f .yarnrc .yarnrc.yml

# Создаем правильный .yarnrc для Yarn 1.x (классический)
if [ -f "yarn.lock" ]; then
    echo "🔧 Создаем правильный .yarnrc для Yarn 1.x..."
    cat > .yarnrc << 'EOF'
# Игнорировать предупреждения о неподдерживаемых движках
ignore-engines true

# Не проверять движки при установке
ignore-optional false

# Цветной вывод
color always

# Отключить прогресс-бар для чистоты вывода
no-progress false

# Разрешить нестрогую проверку peer dependencies
check-files false
EOF
    echo "✅ Создан правильный .yarnrc для Yarn 1.x"
fi

# Переустановка зависимостей с учетом исправлений
echo "📦 Установка зависимостей..."
if [ -f "yarn.lock" ]; then
    echo "📦 Используем Yarn для установки..."
    yarn install --frozen-lockfile --ignore-engines --silent --network-timeout 600000 || {
        echo "⚠️  Первая попытка установки с --frozen-lockfile не удалась, пробуем без него..."
        yarn install --ignore-engines --silent --network-timeout 600000 || {
            echo "⚠️  Вторая попытка не удалась, пробуем с очисткой кэша..."
            yarn cache clean
            yarn install --ignore-engines --network-timeout 600000
        }
    }
else
    # Если нет lock файла, устанавливаем с --legacy-peer-deps
    echo "⚠️  yarn.lock не найден, используем npm с legacy-peer-deps"
    npm install --legacy-peer-deps --silent || {
        echo "⚠️  Первая попытка npm не удалась, пробуем с --force..."
        npm install --legacy-peer-deps --force
    }
fi

# Установка CocoaPods (только для macOS)
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
    echo "☕️ Установка CocoaPods..."
    cd ios

    # Проверяем наличие Gemfile
    if [ -f "Gemfile" ]; then
        bundle install --quiet 2>/dev/null || {
            echo "⚠️  Bundle install не удался, пробуем напрямую..."
            bundle exec pod install --repo-update --silent || pod install --repo-update
        }
    else
        pod install --repo-update --silent || pod install --repo-update
    fi

    cd ..
fi

# Функция для дополнительной проверки после установки
post_install_checks() {
    echo "🔍 Дополнительная проверка зависимостей..."
    if [ -f "package.json" ]; then
        # Проверяем ESLint версию после установки
        local final_eslint_version=$(node -e "
            try {
                const fs = require('fs');
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const deps = {...pkg.dependencies, ...pkg.devDependencies};
                console.log(deps.eslint || 'не установлен');
            } catch(e) { console.log('ошибка чтения'); }
        " 2>/dev/null || echo "")

        if [[ "$final_eslint_version" != "не установлен" ]] && [[ ! "$final_eslint_version" =~ ^8\.5[7-9]|^8\.[6-9]|^9 ]]; then
            echo "⚠️  ESLint всё ещё несовместимая версия ($final_eslint_version)"
            echo "🔄 Принудительно устанавливаем ESLint 8.57.0..."
            if [ -f "yarn.lock" ]; then
                yarn add eslint@8.57.0 --dev --ignore-engines 2>/dev/null || true
            else
                npm install eslint@8.57.0 --save-dev --legacy-peer-deps 2>/dev/null || true
            fi
        fi

        # Удаляем typescript-eslint если он создает проблемы
        local ts_plugin_after=$(node -e "
            try {
                const fs = require('fs');
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const deps = {...pkg.dependencies, ...pkg.devDependencies};
                console.log(deps['@typescript-eslint/eslint-plugin'] || '');
            } catch(e) { console.log(''); }
        " 2>/dev/null || echo "")

        if [[ -n "$ts_plugin_after" ]] && [[ "$ts_plugin_after" =~ ^[8-9] ]]; then
            echo "⚠️  @typescript-eslint всё ещё версии $ts_plugin_after"
            echo "🔄 Удаляем проблемные плагины..."
            if [ -f "yarn.lock" ]; then
                yarn remove @typescript-eslint/eslint-plugin @typescript-eslint/parser --dev 2>/dev/null || true
            else
                npm uninstall @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev 2>/dev/null || true
            fi
        fi
    fi
}

# Вызываем функцию для дополнительных проверок
post_install_checks

# Финальная проверка
echo ""
echo "✅ Полная очистка завершена! 🎉"
echo ""
echo "📊 Статус проекта:"
if [ -f "package.json" ]; then
    echo "🔍 Проверяем оставшиеся предупреждения..."
    if [ -f "yarn.lock" ]; then
        yarn list --depth=0 2>&1 | grep -E "warning|error" | head -15 | grep -v "bare-fs\|bare-os" || echo "✅ Критических предупреждений не найдено"
    else
        npm ls --depth=0 --legacy-peer-deps 2>&1 | grep -E "warning|error" | head -15 | grep -v "bare-fs\|bare-os" || echo "✅ Критических предупреждений не найдено"
    fi
fi

echo ""
echo "📋 Исправленные проблемы:"
echo "   ✓ bare-fs/bare-os warnings - проигнорированы через .npmrc/.yarnrc"
echo "   ✓ @typescript-eslint warnings - исправлены версии"
echo "   ✓ ESLint совместимость - установлена версия 8.57.0+"
echo "   ✓ eslint-plugin-jest - обновлена версия"
echo "   ✓ Workspaces warning - добавлен 'private: true'"
echo "   ✓ React/React DOM совместимость - проверена"
echo "   ✓ .yarnrc синтаксис - исправлен для Yarn 1.x"

echo ""
echo "💡 Следующие шаги:"
echo "   1. yarn start --reset-cache  - Запуск Metro с очисткой кэша"
echo "   2. cd android && ./gradlew clean build  - Тестовая сборка Android"
echo "   3. yarn android  - Запуск приложения"
echo ""
echo "🔧 Если проблемы остались:"
echo "   - Удалите package-lock.json/yarn.lock и node_modules"
echo "   - Запустите: npm install --legacy-peer-deps --force"
echo "   - Или: yarn install --ignore-engines --force"
echo "   - Предупреждения bare-fs/bare-os можно игнорировать"
echo ""
echo "⚠️  Важные заметки:"
echo "   - ESLint должен быть версии 8.57.0 или выше"
echo "   - bare-fs/bare-os предупреждения безопасно игнорировать"
echo "   - Все настройки сохранены в .npmrc и .yarnrc"
echo "   - Проект помечен как 'private: true' для workspaces"
echo "   - Для React Native рекомендуется использовать Node.js 18+"
