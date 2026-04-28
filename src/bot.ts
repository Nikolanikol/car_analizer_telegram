import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { parseCarUrl } from './router';
import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';
import { fetchKbchaData } from './scrapers/kbcha';
import { formatKbchaReport } from './formatters/kbchaReport';
import { fetchKkarData } from './scrapers/kkar';
import { formatKkarReport } from './formatters/kkarReport';
import {
  getUser, getUnlimitedAccess, canMakeRequest,
  incrementRequest, activateUser, generateKey, getStats,
  getKeyInfo, getAdminUserInfo, revokeKey, addBalance, saveUserProfile,
  FREE_REQUESTS,
  type ActivateResult,
} from './storage';

const KEY_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const LOW_BALANCE_THRESHOLD = 3;

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не задан в .env');

const ADMIN_ID = parseInt(process.env.ADMIN_ID || '0');
if (!ADMIN_ID || isNaN(ADMIN_ID)) throw new Error('ADMIN_ID не задан или некорректен в .env');

const bot = new Telegraf(token);

const waitingForKey = new Set<number>();
const keyTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
const keyAttempts = new Map<number, number>();
const keyBannedUntil = new Map<number, number>();
const processingUsers = new Set<number>();
const lastRequestTime = new Map<number, number>();

const KEY_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_KEY_ATTEMPTS = 5;
const KEY_BAN_DURATION_MS = 30 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 5 * 1000;

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
  `<i>Каждому пользователю доступно ${FREE_REQUESTS} бесплатных запросов. Пополнить баланс можно через ключ активации.</i>`;

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
  `<b>Баланс запросов:</b>\n` +
  `Каждому пользователю доступно ${FREE_REQUESTS} бесплатных запросов. Пополнить баланс можно через ключ активации — пишите <a href="https://t.me/caparts">@caparts</a> или заходите на <a href="https://www.kmotors.shop/">kmotors.shop</a>`;

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
  const unlimited = getUnlimitedAccess(userId);
  if (unlimited.active) {
    const expiryLine = unlimited.expiresAt
      ? `\n📅 Действителен до: <b>${new Date(unlimited.expiresAt).toLocaleDateString('ru-RU')}</b>`
      : '';
    return `✅ Безлимитный доступ активирован.${expiryLine}`;
  }
  const user = getUser(userId);
  return `🔢 Остаток запросов: <b>${user.requestBalance}</b>`;
}

bot.start(async (ctx) => {
  saveUserProfile(ctx.from.id, {
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username,
  });
  const msg = await ctx.replyWithHTML(WELCOME_TEXT, MAIN_KEYBOARD);
  await ctx.telegram.pinChatMessage(ctx.chat.id, msg.message_id).catch(() => {});
});

bot.command('help', (ctx) => ctx.replyWithHTML(HELP_TEXT));
bot.command('status', (ctx) => ctx.replyWithHTML(getStatusText(ctx.from.id)));

bot.command('genkey', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  let requestLimit: number | null = null;
  let expiresAt: string | null = null;

  for (const arg of args) {
    if (/^\d+d$/i.test(arg)) {
      const days = parseInt(arg);
      const exp = new Date();
      exp.setDate(exp.getDate() + days);
      expiresAt = exp.toISOString();
    } else if (/^\d+$/.test(arg)) {
      requestLimit = parseInt(arg);
    }
  }

  const key = generateKey({ requestLimit, expiresAt });
  const limitLine = requestLimit !== null ? `🔢 Лимит: <b>${requestLimit}</b> запросов` : `🔢 Лимит: <b>безлимит</b>`;
  const expiryLine = expiresAt
    ? `📅 Истекает: <b>${new Date(expiresAt).toLocaleDateString('ru-RU')}</b>`
    : `📅 Срок: <b>бессрочный</b>`;

  ctx.replyWithHTML(`🔑 Новый ключ активации:\n\n<code>${key}</code>\n\n${limitLine}\n${expiryLine}`);
});

bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.replyWithHTML(getStats());
});

bot.command('keyinfo', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const key = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
  if (!key) return ctx.reply('Использование: /keyinfo XXXX-XXXX-XXXX');

  const info = getKeyInfo(key);
  if (!info) return ctx.reply('❌ Ключ не найден.');

  const now = new Date();
  const expired = info.expiresAt ? now > new Date(info.expiresAt) : false;
  const statusIcon = !info.used ? '🔓 Свободен' : expired ? '⌛ Истёк' : '✅ Активен';
  const typeStr = info.requestLimit !== null ? `${info.requestLimit} запросов` : 'Безлимитный';
  const expiryStr = info.expiresAt
    ? new Date(info.expiresAt).toLocaleDateString('ru-RU')
    : 'Бессрочный';

  let activatedByStr = 'Нет';
  if (info.used && info.usedBy !== null) {
    const userInfo = getAdminUserInfo(info.usedBy);
    if (userInfo) {
      const name = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ');
      const uname = userInfo.username ? ` (@${userInfo.username})` : '';
      activatedByStr = `${name}${uname} (<code>${info.usedBy}</code>)`;
    } else {
      activatedByStr = `ID: <code>${info.usedBy}</code>`;
    }
  }

  ctx.replyWithHTML(
    `🔑 <b>Ключ:</b> <code>${info.id}</code>\n\n` +
    `Статус: <b>${statusIcon}</b>\n` +
    `Тип: <b>${typeStr}</b>\n` +
    `Срок: <b>${expiryStr}</b>\n` +
    `Активирован: <b>${activatedByStr}</b>\n` +
    `Создан: <b>${new Date(info.createdAt).toLocaleDateString('ru-RU')}</b>`
  );
});

bot.command('userinfo', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const userId = parseInt(ctx.message.text.split(/\s+/)[1] ?? '');
  if (isNaN(userId)) return ctx.reply('Использование: /userinfo <telegram_id>');

  const info = getAdminUserInfo(userId);
  if (!info) return ctx.reply('❌ Пользователь не найден.');

  const unlimitedStr = info.unlimitedAccess.active
    ? `✅${info.unlimitedAccess.expiresAt ? ` до ${new Date(info.unlimitedAccess.expiresAt).toLocaleDateString('ru-RU')}` : ' (бессрочно)'}`
    : '❌';

  const nameStr = [info.firstName, info.lastName].filter(Boolean).join(' ');
  const usernameStr = info.username ? ` (@${info.username})` : '';

  ctx.replyWithHTML(
    `👤 <b>${nameStr}${usernameStr}</b>\n` +
    `ID: <code>${userId}</code>\n` +
    `Зарегистрирован: <b>${new Date(info.joinedAt).toLocaleDateString('ru-RU')}</b>\n\n` +
    `Баланс запросов: <b>${info.requestBalance}</b>\n` +
    `Безлимитный доступ: <b>${unlimitedStr}</b>\n` +
    `Ключей активировано: <b>${info.activatedKeys.length}</b>` +
    (info.activatedKeys.length ? `\n<code>${info.activatedKeys.join('\n')}</code>` : '')
  );
});

bot.command('revoke', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const key = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
  if (!key) return ctx.reply('Использование: /revoke XXXX-XXXX-XXXX');

  const success = revokeKey(key);
  if (!success) return ctx.reply('❌ Ключ не найден.');
  ctx.reply(`✅ Ключ <code>${key}</code> отозван.`, { parse_mode: 'HTML' });
});

bot.command('addbalance', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const parts = ctx.message.text.split(/\s+/);
  const userId = parseInt(parts[1] ?? '');
  const amount = parseInt(parts[2] ?? '');
  if (isNaN(userId) || isNaN(amount) || amount <= 0) {
    return ctx.reply('Использование: /addbalance <telegram_id> <количество>');
  }

  const newBalance = addBalance(userId, amount);
  ctx.replyWithHTML(`✅ Пользователю <code>${userId}</code> начислено <b>${amount}</b> запросов.\nНовый баланс: <b>${newBalance}</b>`);
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

  const bannedUntil = keyBannedUntil.get(userId);
  if (bannedUntil && Date.now() < bannedUntil) {
    const minutesLeft = Math.ceil((bannedUntil - Date.now()) / 60000);
    return ctx.reply(`🚫 Ввод ключей заблокирован. Попробуй через <b>${minutesLeft} мин.</b>`, { parse_mode: 'HTML' });
  }

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

    if (!KEY_PATTERN.test(text.toUpperCase())) {
      return ctx.reply('❌ Неверный формат ключа. Ожидается: XXXX-XXXX-XXXX');
    }

    const result: ActivateResult = activateUser(userId, text.toUpperCase());

    if (result.status === 'ok') {
      keyAttempts.delete(userId);
      keyBannedUntil.delete(userId);
      if (result.credited !== null) {
        return ctx.replyWithHTML(
          `✅ Ключ принят! Начислено <b>${result.credited}</b> запросов.\n🔢 Баланс: <b>${result.newBalance}</b>`
        );
      } else {
        const expiryLine = result.expiresAt
          ? `\n📅 Действителен до: <b>${new Date(result.expiresAt).toLocaleDateString('ru-RU')}</b>`
          : '';
        return ctx.replyWithHTML(`✅ Безлимитный доступ активирован!${expiryLine}`);
      }
    }

    // Считаем неудачную попытку только для подозрительных случаев
    if (result.status === 'not_found' || result.status === 'already_bound') {
      const attempts = (keyAttempts.get(userId) ?? 0) + 1;
      keyAttempts.set(userId, attempts);
      const remaining = MAX_KEY_ATTEMPTS - attempts;
      if (remaining <= 0) {
        keyAttempts.delete(userId);
        keyBannedUntil.set(userId, Date.now() + KEY_BAN_DURATION_MS);
        return ctx.reply('🚫 Превышен лимит попыток. Ввод ключей заблокирован на 30 минут.');
      }
      const suffix = result.status === 'already_bound'
        ? 'Ключ уже используется другим пользователем.'
        : 'Ключ не найден.';
      return ctx.reply(`❌ ${suffix} Осталось попыток: <b>${remaining}</b>`, { parse_mode: 'HTML' });
    }

    if (result.status === 'expired') return ctx.reply('❌ Срок действия ключа истёк.');
    if (result.status === 'already_activated') return ctx.reply('ℹ️ Этот ключ уже активирован тобой.');
    return ctx.reply('❌ Ключ не найден.');
  }

  if (!canMakeRequest(userId)) {
    return ctx.replyWithHTML(
      `Баланс запросов исчерпан.\n\nПополни баланс через ключ активации. По вопросам пиши <a href="https://t.me/caparts">@caparts</a>`,
      Markup.inlineKeyboard([Markup.button.callback('🔑 Ввести ключ', 'enter_key')])
    );
  }

  let parsed;
  try {
    parsed = parseCarUrl(text);
  } catch (e: any) {
    return ctx.reply(`❌ ${e.message}`);
  }

  if (processingUsers.has(userId)) {
    return ctx.reply('⏳ Подожди, ещё обрабатываю предыдущий запрос.');
  }

  const last = lastRequestTime.get(userId);
  if (last) {
    const secondsLeft = Math.ceil((REQUEST_COOLDOWN_MS - (Date.now() - last)) / 1000);
    if (secondsLeft > 0) {
      return ctx.reply(`⏱ Подожди ещё <b>${secondsLeft} сек.</b> перед следующим запросом.`, { parse_mode: 'HTML' });
    }
  }

  incrementRequest(userId);
  processingUsers.add(userId);

  const loading = await ctx.reply('⏳ Загружаю данные...');
  const typingInterval = setInterval(() => {
    ctx.sendChatAction('typing').catch(() => {});
  }, 4000);
  ctx.sendChatAction('typing').catch(() => {});

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

    // Low balance warning (only for users without unlimited access)
    const unlimited = getUnlimitedAccess(userId);
    if (!unlimited.active) {
      const balance = getUser(userId).requestBalance;
      if (balance > 0 && balance <= LOW_BALANCE_THRESHOLD) {
        await ctx.replyWithHTML(
          `⚠️ Осталось <b>${balance}</b> ${balance === 1 ? 'запрос' : 'запроса'}. Пополни баланс через ключ активации.`,
          Markup.inlineKeyboard([Markup.button.callback('🔑 Ввести ключ', 'enter_key')])
        );
      }
    }
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Ошибка для ID ${parsed.id}:`, e.message);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    await ctx.reply(`❌ Ошибка при получении данных: ${e.message}`);
  } finally {
    clearInterval(typingInterval);
    processingUsers.delete(userId);
    lastRequestTime.set(userId, Date.now());
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
