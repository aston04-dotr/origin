# Сборка Android (Shadow Run)

## Java 17

Проект настроен на Java 17 (`gradle.properties`, `app/build.gradle`). Убедитесь, что в системе установлена JDK 17 и Gradle её использует (например, через `JAVA_HOME` или `org.gradle.java.home` в `gradle.properties`).

## Важно: путь без «!»

В путях к проекту **не должно быть символа `!`**.  
Компилятор Kotlin/Java воспринимает `!` в путях как разделитель JAR, из‑за чего сборка падает с `FileNotFoundException: .../... (No such file or directory)`.

**Решение:** собирать проект из папки с именем **без** восклицательного знака.

- Либо переименуйте папку проекта так, чтобы в пути не было `!` (например, `mygame` или `ShadowRun`).
- Либо скопируйте `frontend` в каталог с путём без `!` (например, `~/projects/mygame/frontend`) и собирайте оттуда.

После этого:

```bash
cd /путь/к/mygame/frontend/android
./gradlew clean

cd /путь/к/mygame/frontend
npx react-native run-android
```

Убедитесь, что заданы `ANDROID_HOME` (или `sdk.dir` в `android/local.properties`) и запущен эмулятор или подключено устройство.
