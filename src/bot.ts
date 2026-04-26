import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { parseCarUrl } from './router';
import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';
import { fetchKbchaData } from './scrapers/kbcha';
import { formatKbchaReport } from './formatters/kbchaReport';
import { fetchKkarData } from './scrapers/kkar';
import { formatKkarReport } from './formatters/kkarReport';
import { getUser, incrementRequest, activateUser, generateKey, getStats, FREE_REQUESTS } from './storage';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не задан в .env');

const ADMIN_ID = parseInt(process.env.ADMIN_ID || '0');
if (!ADMIN_ID || isNaN(ADMIN_ID)) throw new Error('ADMIN_ID не задан или некорректен в .env');

const bot = new Telegraf(token);

const waitingForKey = new Set<number>();
const keyTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

const KEY_TIMEOUT_MS = 5 * 60 * 1000;

const MAIN_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('❓ Как пользоваться', 'help'),
    Markup.button.callback('📋 Пример отчёта', 'example'),
  ],
  [
    Markup.button.callback('🔑 Ввести ключ', 'enter_key'),
    Markup.button.callback('📊 Мой статус', 'status'),
  ],
  [
    Markup.button.url('💬 Связаться с нами', 'https://t.me/caparts'),
  ],
]);

const WELCOME_TEXT =
  `<b>Добро пожаловать в Car Analyzer!</b>\n\n` +
  `Этот бот помогает проверить автомобиль перед покупкой на корейских площадках.\n\n` +
  `<b>Что умеет бот:</b>\n` +
  `• Отчёт по истории страхования и ДТП\n` +
  `• Данные технического осмотра\n` +
  `• Пробег, год выпуска, комплектация\n\n` +
  `<b>Поддерживаемые площадки:</b>\n` +
  `• encar.com\n` +
  `• kbchachacha.com\n` +
  `• kcar.com\n\n` +
  `Просто отправь ссылку на автомобиль — бот сделает всё остальное.\n\n` +
  `🌐 <b>Наша площадка:</b> <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
  `<i>Доступно ${FREE_REQUESTS} бесплатных запросов. Для безлимитного доступа нужен ключ активации.</i>`;

const HELP_TEXT =
  `<b>❓ Как пользоваться</b>\n\n` +
  `1. Зайди на одну из поддерживаемых площадок\n` +
  `2. Открой страницу любого автомобиля\n` +
  `3. Скопируй ссылку из адресной строки\n` +
  `4. Отправь ссылку в этот чат\n\n` +
  `<b>Примеры ссылок:</b>\n` +
  `• <code>https://www.encar.com/dc/dc_cardetailview.do?carid=12345678</code>\n` +
  `• <code>https://www.kbchachacha.com/public/car/detail.kbc?carSeq=12345678</code>\n` +
  `• <code>https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=ABC1234</code>\n\n` +
  `<b>Ключ активации:</b>\n` +
  `Для безлимитного доступа нужен ключ. По вопросам пиши <a href="https://t.me/caparts">@caparts</a> или заходи на <a href="https://www.kmotors.shop/">kmotors.shop</a>`;

const EXAMPLE_REPORT =
  `<b>📋 Пример отчёта</b>\n` +
  `<i>Так выглядит отчёт по автомобилю с нашего бота:</i>\n\n` +
  `🚗 <b>Kia Ray</b>\n` +
  `Дирекс Спесел\n` +
  `<a href="https://www.encar.com/dc/dc_cardetailview.do?carid=40839556">encar.com/dc/dc_cardetailview.do?carid=40839556</a>\n\n` +
  `📋 <b>Основные данные</b>\n` +
  `Номер авто:  <b>66보9144</b>\n` +
  `VIN:         <b>KNACH811BDT050022</b>\n` +
  `Год выпуска: <b>2013</b>\n` +
  `Пробег:      <b>93 801 км</b>\n` +
  `Цена:        <b>5 390 000 ₩</b>\n` +
  `КПП:         Автомат (오토)\n` +
  `Топливо:     Бензин (가솔린)\n` +
  `Двигатель:   1.0л\n` +
  `Цвет:        Голубой (하늘색)\n` +
  `Адрес:       충남 천안시 동남구\n\n` +
  `🔍 <b>Страховая история</b>\n` +
  `⚠️ Аварий (виновник): 2 — 5 140 820 ₩\n` +
  `⚠️ Аварий (пострадавший): 1 — 360 598 ₩\n` +
  `Первая рег.: 2013-01-18\n\n` +
  `🔧 <b>Техническая инспекция</b>\n` +
  `Узлы: ✅ Всё в норме\n` +
  `Кузовные повреждения:\n` +
  `🔴 Переднее крыло (пр.): Замена\n` +
  `🔴 Капот: Замена\n` +
  `🔴 Крышка багажника: Замена\n` +
  `🔴 Переднее крыло (лев.): Замена\n` +
  `⚠️ Порог панель (лев.): Рихтовка/сварка\n` +
  `⚠️ Задняя панель: Замена`;

const CONTACT_TEXT =
  `<b>💬 Связаться с нами</b>\n\n` +
  `Telegram: <a href="https://t.me/caparts">@caparts</a>\n` +
  `Сайт: <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
  `<i>По вопросам ключей активации, сотрудничества и помощи — пишите нам.</i>`;

function getStatusText(userId: number): string {
  const user = getUser(userId);
  if (user.activated) return '✅ У тебя безлимитный доступ.';
  return `📊 Использовано запросов: <b>${user.requestCount} / ${FREE_REQUESTS}</b>`;
}

bot.start(async (ctx) => {
  const msg = await ctx.replyWithHTML(WELCOME_TEXT, MAIN_KEYBOARD);
  await ctx.telegram.pinChatMessage(ctx.chat.id, msg.message_id).catch(() => {});
});

bot.command('help', (ctx) => ctx.replyWithHTML(HELP_TEXT));
bot.command('status', (ctx) => ctx.replyWithHTML(getStatusText(ctx.from.id)));

bot.command('genkey', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const key = generateKey();
  ctx.reply(`Новый ключ активации:\n\n<code>${key}</code>`, { parse_mode: 'HTML' });
});

bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.replyWithHTML(getStats());
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML(HELP_TEXT);
});

bot.action('example', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML(EXAMPLE_REPORT);
});

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML(getStatusText(ctx.from.id));
});

bot.action('enter_key', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;

  if (keyTimeouts.has(userId)) {
    clearTimeout(keyTimeouts.get(userId)!);
    keyTimeouts.delete(userId);
  }

  waitingForKey.add(userId);
  await ctx.reply('Отправь свой ключ активации (формат: XXXX-XXXX-XXXX):\n⏱ У тебя есть 5 минут.');

  const timer = setTimeout(async () => {
    if (waitingForKey.has(userId)) {
      waitingForKey.delete(userId);
      keyTimeouts.delete(userId);
      await ctx.reply('⌛ Время ввода ключа истекло. Нажми кнопку снова если хочешь попробовать.');
    }
  }, KEY_TIMEOUT_MS);

  keyTimeouts.set(userId, timer);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  if (waitingForKey.has(userId)) {
    waitingForKey.delete(userId);
    clearTimeout(keyTimeouts.get(userId)!);
    keyTimeouts.delete(userId);
    const success = activateUser(userId, text.toUpperCase());
    if (success) {
      return ctx.reply('✅ Ключ принят! У тебя теперь безлимитный доступ.');
    } else {
      return ctx.reply('❌ Ключ недействителен или уже использован.');
    }
  }

  const user = getUser(userId);
  if (!user.activated && user.requestCount >= FREE_REQUESTS) {
    return ctx.replyWithHTML(
      `Ты использовал все <b>${FREE_REQUESTS}</b> бесплатных запросов.\n\nДля продолжения необходим ключ активации. По вопросам пиши <a href="https://t.me/caparts">@caparts</a>`,
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
    if (parsed.source === 'encar') {
      const data = await fetchEncarData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
      await ctx.replyWithHTML(formatEncarReport(data, false));
      await ctx.replyWithHTML(formatEncarReport(data, true));
    } else if (parsed.source === 'kbcha') {
      const data = await fetchKbchaData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
      if (data.mainPhoto) await ctx.replyWithPhoto(data.mainPhoto);
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, false));
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, true));
    } else {
      const data = await fetchKkarData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
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

bot.catch((err: unknown, ctx) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${new Date().toISOString()}] [bot.catch] Необработанная ошибка для пользователя ${ctx.from?.id} (@${ctx.from?.username ?? '—'}): ${message}`);
  ctx.reply('❌ Произошла неожиданная ошибка. Попробуй ещё раз или напиши нам: @caparts').catch(() => {});
});

bot.launch();
console.log('Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
