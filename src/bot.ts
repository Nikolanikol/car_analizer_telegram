import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { parseCarUrl } from './router';
import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';
import { fetchKbchaData } from './scrapers/kbcha';
import { formatKbchaReport } from './formatters/kbchaReport';
import { fetchKkarData } from './scrapers/kkar';
import { formatKkarReport } from './formatters/kkarReport';
import { getUser, incrementRequest, activateUser, generateKey, FREE_REQUESTS } from './storage';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не задан в .env');

const ADMIN_ID = parseInt(process.env.ADMIN_ID || '0');

const bot = new Telegraf(token);

// Пользователи, ожидающие ввода ключа
const waitingForKey = new Set<number>();

const WELCOME_TEXT =
  `<b>Добро пожаловать в Car Analyzer!</b>\n\n` +
  `Этот бот помогает проверить автомобиль перед покупкой на корейских площадках.\n\n` +
  `<b>Что умеет бот:</b>\n` +
  `• Отчёт по истории страхования и ДТП\n` +
  `• Данные технического осмотра\n` +
  `• Пробег, год выпуска, комплектация\n` +
  `• Фотографии с объявления\n\n` +
  `<b>Поддерживаемые площадки:</b>\n` +
  `• encar.com\n` +
  `• kbchachacha.com\n` +
  `• kkar.com\n\n` +
  `<b>Как пользоваться:</b>\n` +
  `Просто отправь ссылку на автомобиль — бот сделает всё остальное.\n\n` +
  `<i>Доступно ${FREE_REQUESTS} бесплатных запросов. Для безлимитного доступа введи ключ активации.</i>`;

bot.start((ctx) => ctx.replyWithHTML(WELCOME_TEXT));

bot.command('genkey', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const key = generateKey();
  ctx.reply(`Новый ключ активации:\n\n<code>${key}</code>`, { parse_mode: 'HTML' });
});

bot.command('status', (ctx) => {
  const user = getUser(ctx.from.id);
  if (user.activated) {
    return ctx.reply('✅ У тебя безлимитный доступ.');
  }
  ctx.reply(`📊 Использовано запросов: ${user.requestCount} / ${FREE_REQUESTS}`);
});

// Нажатие кнопки "Ввести ключ"
bot.action('enter_key', async (ctx) => {
  await ctx.answerCbQuery();
  waitingForKey.add(ctx.from.id);
  await ctx.reply('Отправь свой ключ активации (формат: XXXX-XXXX-XXXX):');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Пользователь вводит ключ
  if (waitingForKey.has(userId)) {
    waitingForKey.delete(userId);
    const success = activateUser(userId, text.toUpperCase());
    if (success) {
      return ctx.reply('✅ Ключ принят! У тебя теперь безлимитный доступ.');
    } else {
      return ctx.reply('❌ Ключ недействителен или уже использован.');
    }
  }

  const user = getUser(userId);
  if (!user.activated && user.requestCount >= FREE_REQUESTS) {
    return ctx.reply(
      `Ты использовал все ${FREE_REQUESTS} бесплатных запросов.\n\nДля продолжения необходим ключ активации.`,
      Markup.inlineKeyboard([Markup.button.callback('🔑 Ввести ключ', 'enter_key')])
    );
  }

  let parsed;
  try {
    parsed = parseCarUrl(text);
  } catch (e: any) {
    return ctx.reply(`❌ ${e.message}`);
  }

  incrementRequest(userId);

  const loading = await ctx.reply('⏳ Загружаю данные...');

  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);

    if (parsed.source === 'encar') {
      const data = await fetchEncarData(parsed.id);
      await ctx.replyWithHTML(formatEncarReport(data, false));
      await ctx.replyWithHTML(formatEncarReport(data, true));
    } else if (parsed.source === 'kbcha') {
      const data = await fetchKbchaData(parsed.id);
      if (data.mainPhoto) await ctx.replyWithPhoto(data.mainPhoto);
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, false));
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, true));
    } else {
      const data = await fetchKkarData(parsed.id);
      if (data.mainPhoto) await ctx.replyWithPhoto(data.mainPhoto);
      await ctx.replyWithHTML(formatKkarReport(data, false));
      await ctx.replyWithHTML(formatKkarReport(data, true));
    }
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Ошибка для ID ${parsed.id}:`, e.message);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    await ctx.reply(`❌ Ошибка при получении данных: ${e.message}`);
  }
});

bot.launch();
console.log('Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
