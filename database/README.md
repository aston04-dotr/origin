# Shadow Run — база данных

## Создание БД и применение схемы

Убедитесь, что PostgreSQL установлен и запущен. На macOS:

```bash
# Установка (если ещё нет): brew install postgresql@16
# Запуск: brew services start postgresql@16

# Из корня проекта (mygame):
createdb shadow_run
psql shadow_run -f database/schema.sql
```

Если `psql` не в PATH, укажите полный путь, например:

```bash
/opt/homebrew/opt/postgresql@16/bin/createdb shadow_run
/opt/homebrew/opt/postgresql@16/bin/psql shadow_run -f database/schema.sql
```

В `backend/.env` должно быть: `DATABASE_URL=postgresql://localhost:5432/shadow_run`.
