# Shadow Run — игра копы vs бандиты

Локационная многопользовательская игра с ролями **коп** и **бандит**. Копы патрулируют и ловят бандитов; бандиты убегают и прячутся.

## Структура проекта

```
Shadow Run/
├── frontend/          # React Native приложение (iOS/Android)
├── backend/           # Node.js + Express + WebSocket API
├── database/          # PostgreSQL схема и миграции
└── README.md
```

## Требования

- **Node.js** 18+
- **PostgreSQL** 14+
- **React Native** (Xcode для iOS, Android Studio для Android)
- **Mapbox** аккаунт (бесплатный tier)
- Для платежей: Google Play Console, ЮKassa (для iOS)

## Быстрый старт

### 1. База данных

Убедитесь, что PostgreSQL запущен и в PATH есть команды `createdb` и `psql`. Из корня проекта (mygame):

```bash
createdb shadow_run
psql shadow_run -f database/schema.sql
# при необходимости: psql shadow_run -f database/migrations/001_initial.sql
```

В `backend/.env` задайте: `DATABASE_URL=postgresql://localhost:5432/shadow_run`

### 2. Backend

```bash
cd backend
cp .env.example .env   # заполнить DATABASE_URL, MAPBOX_TOKEN, JWT_SECRET и т.д.
npm install
npm run dev
```

Сервер: `http://localhost:3000`, WebSocket: `ws://localhost:3000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # MAPBOX_ACCESS_TOKEN, API_URL, WS_URL
npm install
npx pod-install        # только для iOS
npm run ios            # или npm run android
```

### 4. Геолокация

- **Коп** видит бандитов в радиусе **200 м**.
- **Бандит** видит копов в радиусе **50 м**.
- Карта и геолокация через **Mapbox**.

### 5. Монетизация (бесплатная игра)

- **Android**: Google Play Billing — скины, Battle Pass, усилители.
- **iOS**: внешние ссылки на оплату через **ЮKassa** (вне In-App Purchase по правилам Apple — только для определённых типов контента; скины/Battle Pass обычно через IAP).

## Тестирование

1. **База данных**: создайте БД и примените схему:
   ```bash
   createdb shadow_run
   psql shadow_run -f database/schema.sql
   ```

2. **Backend**:
   ```bash
   cd backend && cp .env.example .env && npm run dev
   ```
   Проверка: `curl http://localhost:3000/health`

3. **Frontend**: в другом терминале:
   ```bash
   cd frontend && cp .env.example .env
   # В .env задайте MAPBOX_ACCESS_TOKEN для карты (опционально)
   npm start
   npm run ios   # или npm run android
   ```
   Для Android-эмулятора в `.env`: `API_URL=http://10.0.2.2:3000`, `WS_URL=ws://10.0.2.2:3000`.

4. **Сценарий**: войдите как «Коп» и как «Бандит» (два устройства/эмулятора или смена аккаунта), включите геолокацию — на карте должны отображаться игроки в радиусе (коп 200 м, бандит 50 м).

## Публикация на GitHub

Репозиторий уже инициализирован (Git). Чтобы отправить проект на GitHub:

1. Создайте новый репозиторий на [github.com](https://github.com/new) (например, `shadow-run` или `mygame`). Не добавляйте README, .gitignore или лицензию — они уже есть в проекте.

2. Подключите удалённый репозиторий и выполните первый push:

```bash
cd /путь/к/mygame
git remote add origin https://github.com/ВАШ_USERNAME/ИМЯ_РЕПОЗИТОРИЯ.git
git branch -M main
git push -u origin main
```

Замените `ВАШ_USERNAME` и `ИМЯ_РЕПОЗИТОРИЯ` на свои. Для SSH используйте: `git@github.com:ВАШ_USERNAME/ИМЯ_РЕПОЗИТОРИЯ.git`.

## Лицензия

Проект создан в учебных целях. Shadow Run — название проекта.
