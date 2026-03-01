# Shadow Run Backend

Node.js + Express + WebSocket + PostgreSQL.

## Установка

```bash
npm install
cp .env.example .env
# Заполнить DATABASE_URL, JWT_SECRET, MAPBOX_ACCESS_TOKEN (опционально)
```

## Запуск

```bash
# Создать БД: createdb boom_game && psql boom_game -f ../database/schema.sql
npm run dev
```

- HTTP API: http://localhost:3000/api
- WebSocket: ws://localhost:3000/

## API

- `POST /api/players/register` — регистрация (body: username, email?, role?, device_id?)
- `GET /api/players/:id` — профиль игрока
- `POST /api/location` — обновить геолокацию (session_id, player_id, lat, lon, heading?, speed_kmh?)
- `POST /api/nearby` — кто виден (player_id, lat, lon, my_role)
- `POST /api/action` — действие: catch, escape, hide, patrol (session_id, player_id, action_type, target_id?, lat?, lon?)

## Античит

- Проверка скорости перемещения (MAX_REASONABLE_SPEED_KMH, по умолчанию 200 км/ч).
- Валидация координат.

## Тесты

```bash
npm test
```
