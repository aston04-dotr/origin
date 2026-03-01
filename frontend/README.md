# Shadow Run — React Native (Frontend)

Приложение для игры «Копы vs Бандиты» с картой Mapbox, геолокацией и внутриигровыми покупками.

## Требования

- Node.js 18+
- Xcode (iOS) / Android Studio (Android)
- Аккаунт Mapbox (бесплатный): https://account.mapbox.com/

## Установка

```bash
npm install
cp .env.example .env
# В .env укажите MAPBOX_ACCESS_TOKEN (pk.xxx), при необходимости API_URL и WS_URL
```

Для iOS (после установки зависимостей):

```bash
cd ios && bundle exec pod install && cd ..
```

## Запуск

```bash
# Метро
npm start

# В другом терминале
npm run ios     # или npm run android
```

Для Android-эмулятора используйте в `.env`: `API_URL=http://10.0.2.2:3000`, `WS_URL=ws://10.0.2.2:3000`.

## Экраны

- **Вход** — выбор роли (коп/бандит) и никнейм.
- **Коп** — карта с зоной 200 м, кнопки «Патруль» и «Поймать» для видимых бандитов.
- **Бандит** — карта с зоной 50 м, кнопки «Побег» и «Скрыться».
- **Профиль** — XP, уровень, роль, инвентарь.
- **Магазин** — скины, Battle Pass, усилители (Android: Google Play Billing, iOS: ссылка на ЮKassa).

## Mapbox

Токен задаётся в `src/config.ts` или в `.env` как `MAPBOX_ACCESS_TOKEN`. Без токена карта показывается как заглушка с координатами.

## Платежи

- **Android**: тест через `POST /api/purchases/android/verify`; в проде — интеграция с Google Play Billing (react-native-iap).
- **iOS**: открытие внешней ссылки на оплату (ЮKassa).
