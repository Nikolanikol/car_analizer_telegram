# 🚗 Car Analyzer Bot

[![Deploy to Fly.io](https://github.com/Nikolanikol/car_analizer_telegram/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nikolanikol/car_analizer_telegram/actions/workflows/deploy.yml)

**RU** | [EN](#english)

---

## Описание

Telegram-бот для проверки автомобилей с корейских площадок перед покупкой. Отправь ссылку на объявление — бот вернёт подробный отчёт.

## Возможности

- История страхования и ДТП
- Данные технического осмотра
- Пробег, год выпуска, комплектация
- Фотографии с объявления
- 10 бесплатных запросов, далее по ключу активации

## Поддерживаемые площадки

| Площадка | Сайт |
|----------|------|
| Encar | [encar.com](https://encar.com) |
| KB차차차 | [kbchachacha.com](https://www.kbchachacha.com) |
| Kkar | [kkar.com](https://www.kkar.com) |

## Как пользоваться

1. Найди автомобиль на одной из поддерживаемых площадок
2. Скопируй ссылку на объявление
3. Отправь ссылку боту
4. Получи подробный отчёт

## Локальная разработка

### Требования

- Node.js 20+
- npm

### Установка

```bash
git clone https://github.com/Nikolanikol/car_analizer_telegram.git
cd car_analizer_telegram
npm install
```

### Настройка

Создай файл `.env` на основе `.env.example`:

```env
BOT_TOKEN=your_test_bot_token
ADMIN_ID=your_telegram_id
```

> Для разработки используй отдельного тестового бота через [@BotFather](https://t.me/BotFather)

### Запуск

```bash
npm run dev
```

## Деплой

Проект автоматически деплоится на [Fly.io](https://fly.io) при каждом push в ветку `main`.

### Ручной деплой

```bash
flyctl deploy --ha=false
```

### Переменные окружения на сервере

```bash
flyctl secrets set BOT_TOKEN=your_token ADMIN_ID=your_id DATA_DIR=/data
```

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Приветственное меню |
| `/status` | Количество использованных запросов |
| `/genkey` | Генерация ключа активации (только админ) |

---

## English

## Description

A Telegram bot for checking cars from Korean marketplaces before purchase. Send a listing URL — the bot returns a detailed report.

## Features

- Insurance and accident history
- Technical inspection data
- Mileage, year, trim level
- Photos from the listing
- 10 free requests, then activation key required

## Supported Platforms

| Platform | Website |
|----------|---------|
| Encar | [encar.com](https://encar.com) |
| KB차차차 | [kbchachacha.com](https://www.kbchachacha.com) |
| Kkar | [kkar.com](https://www.kkar.com) |

## How to Use

1. Find a car on one of the supported platforms
2. Copy the listing URL
3. Send the URL to the bot
4. Receive a detailed report

## Local Development

### Requirements

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/Nikolanikol/car_analizer_telegram.git
cd car_analizer_telegram
npm install
```

Create `.env` file based on `.env.example`:

```env
BOT_TOKEN=your_test_bot_token
ADMIN_ID=your_telegram_id
```

> Use a separate test bot via [@BotFather](https://t.me/BotFather) for development

### Run

```bash
npm run dev
```

## Deployment

The project is automatically deployed to [Fly.io](https://fly.io) on every push to `main`.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome menu |
| `/status` | Number of requests used |
| `/genkey` | Generate activation key (admin only) |

## Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Bot Framework:** [Telegraf](https://telegraf.js.org/)
- **Scraping:** Axios + Cheerio
- **Hosting:** Fly.io
- **CI/CD:** GitHub Actions
