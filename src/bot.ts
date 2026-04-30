import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { parseCarUrl } from './router';
import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';
import { fetchKbchaData } from './scrapers/kbcha';
import { formatKbchaReport } from './formatters/kbchaReport';
import { fetchKkarData } from './scrapers/kkar';
import { formatKkarReport } from './formatters/kkarReport';
import { t, type Lang } from './i18n';
import {
  getUser, getUnlimitedAccess, canMakeRequest,
  incrementRequest, activateUser, generateKey, getStats,
  getKeyInfo, getAdminUserInfo, revokeKey, addBalance, saveUserProfile,
  getUserLanguage, setUserLanguage,
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

function mainKeyboard(lang: Lang) {
  const s = t(lang);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(s.btnHelp, 'help'),
      Markup.button.callback(s.btnExample, 'example'),
    ],
    [
      Markup.button.callback(s.btnEnterKey, 'enter_key'),
      Markup.button.callback(s.btnStatus, 'status'),
    ],
    [
      Markup.button.url(s.btnContact, 'https://t.me/caparts'),
      Markup.button.callback(s.btnLanguage, 'toggle_language'),
    ],
  ]);
}

function getStatusText(userId: number, lang: Lang): string {
  const s = t(lang);
  const unlimited = getUnlimitedAccess(userId);
  if (unlimited.active) {
    const expiryLine = unlimited.expiresAt
      ? s.statusExpiresAt(new Date(unlimited.expiresAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB'))
      : '';
    return s.statusUnlimited(expiryLine);
  }
  const user = getUser(userId);
  return s.statusBalance(user.requestBalance);
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  saveUserProfile(userId, {
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username,
  });
  const lang = getUserLanguage(userId);
  const msg = await ctx.replyWithHTML(t(lang).welcome(FREE_REQUESTS), mainKeyboard(lang));
  await ctx.telegram.pinChatMessage(ctx.chat.id, msg.message_id).catch(() => {});
});

bot.command('help', (ctx) => {
  const lang = getUserLanguage(ctx.from.id);
  ctx.replyWithHTML(t(lang).help(FREE_REQUESTS));
});

bot.command('status', (ctx) => {
  const lang = getUserLanguage(ctx.from.id);
  ctx.replyWithHTML(getStatusText(ctx.from.id, lang));
});

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
  const s = t('ru');
  const limitLine = requestLimit !== null ? s.adminKeyLimitN(requestLimit) : s.adminKeyLimitUnlimited;
  const expiryLine = expiresAt
    ? s.adminKeyExpiryDate(new Date(expiresAt).toLocaleDateString('ru-RU'))
    : s.adminKeyExpiryNone;

  ctx.replyWithHTML(s.adminKeyCreated(key, limitLine, expiryLine));
});

bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.replyWithHTML(getStats());
});

bot.command('keyinfo', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const s = t('ru');
  const key = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
  if (!key) return ctx.reply(s.adminUsageInvalid('/keyinfo XXXX-XXXX-XXXX'));

  const info = getKeyInfo(key);
  if (!info) return ctx.reply(s.adminKeyNotFound);

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
  const s = t('ru');
  const userId = parseInt(ctx.message.text.split(/\s+/)[1] ?? '');
  if (isNaN(userId)) return ctx.reply(s.adminUsageInvalid('/userinfo <telegram_id>'));

  const info = getAdminUserInfo(userId);
  if (!info) return ctx.reply(s.adminUserNotFound);

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
  const s = t('ru');
  const key = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
  if (!key) return ctx.reply(s.adminUsageInvalid('/revoke XXXX-XXXX-XXXX'));

  const success = revokeKey(key);
  if (!success) return ctx.reply(s.adminKeyNotFound);
  ctx.reply(s.adminKeyRevoked(key), { parse_mode: 'HTML' });
});

bot.command('addbalance', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const s = t('ru');
  const parts = ctx.message.text.split(/\s+/);
  const userId = parseInt(parts[1] ?? '');
  const amount = parseInt(parts[2] ?? '');
  if (isNaN(userId) || isNaN(amount) || amount <= 0) {
    return ctx.reply(s.adminUsageInvalid('/addbalance <telegram_id> <количество>'));
  }

  const newBalance = addBalance(userId, amount);
  ctx.replyWithHTML(s.adminBalanceAdded(userId, amount, newBalance));
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getUserLanguage(ctx.from.id);
  await ctx.replyWithHTML(t(lang).help(FREE_REQUESTS));
});

bot.action('example', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getUserLanguage(ctx.from.id);
  await ctx.replyWithHTML(t(lang).exampleReport);
});

bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getUserLanguage(ctx.from.id);
  await ctx.replyWithHTML(getStatusText(ctx.from.id, lang));
});

bot.action('toggle_language', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const current = getUserLanguage(userId);
  const next: Lang = current === 'ru' ? 'en' : 'ru';
  setUserLanguage(userId, next);
  const s = t(next);
  await ctx.replyWithHTML(s.languageChanged, mainKeyboard(next));
});

bot.action('enter_key', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const lang = getUserLanguage(userId);
  const s = t(lang);

  const bannedUntil = keyBannedUntil.get(userId);
  if (bannedUntil && Date.now() < bannedUntil) {
    const minutesLeft = Math.ceil((bannedUntil - Date.now()) / 60000);
    return ctx.replyWithHTML(s.keyBanned(minutesLeft));
  }

  if (keyTimeouts.has(userId)) {
    clearTimeout(keyTimeouts.get(userId)!);
    keyTimeouts.delete(userId);
  }

  waitingForKey.add(userId);
  await ctx.reply(s.keyPrompt);

  const timer = setTimeout(async () => {
    if (waitingForKey.has(userId)) {
      waitingForKey.delete(userId);
      keyTimeouts.delete(userId);
      await ctx.reply(s.keyTimeout);
    }
  }, KEY_TIMEOUT_MS);

  keyTimeouts.set(userId, timer);
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const lang = getUserLanguage(userId);
  const s = t(lang);

  if (waitingForKey.has(userId)) {
    waitingForKey.delete(userId);
    clearTimeout(keyTimeouts.get(userId)!);
    keyTimeouts.delete(userId);

    if (!KEY_PATTERN.test(text.toUpperCase())) {
      return ctx.reply(s.keyInvalidFormat);
    }

    const result: ActivateResult = activateUser(userId, text.toUpperCase());

    if (result.status === 'ok') {
      keyAttempts.delete(userId);
      keyBannedUntil.delete(userId);
      if (result.credited !== null) {
        return ctx.replyWithHTML(s.keyAcceptedCredits(result.credited, result.newBalance!));
      } else {
        const expiryLine = result.expiresAt
          ? s.keyExpiredUnlimitedLine(new Date(result.expiresAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB'))
          : '';
        return ctx.replyWithHTML(s.keyAcceptedUnlimited(expiryLine));
      }
    }

    if (result.status === 'not_found' || result.status === 'already_bound') {
      const attempts = (keyAttempts.get(userId) ?? 0) + 1;
      keyAttempts.set(userId, attempts);
      const remaining = MAX_KEY_ATTEMPTS - attempts;
      if (remaining <= 0) {
        keyAttempts.delete(userId);
        keyBannedUntil.set(userId, Date.now() + KEY_BAN_DURATION_MS);
        return ctx.reply(s.keyBannedTooManyAttempts);
      }
      return ctx.replyWithHTML(
        result.status === 'already_bound'
          ? s.keyAlreadyBound(remaining)
          : s.keyNotFound(remaining)
      );
    }

    if (result.status === 'expired') return ctx.reply(s.keyExpired);
    if (result.status === 'already_activated') return ctx.reply(s.keyAlreadyActivated);
    return ctx.reply(s.keyNotFound(MAX_KEY_ATTEMPTS));
  }

  if (!canMakeRequest(userId)) {
    return ctx.replyWithHTML(
      s.balanceExhausted,
      Markup.inlineKeyboard([Markup.button.callback(s.btnEnterKey, 'enter_key')])
    );
  }

  let parsed;
  try {
    parsed = parseCarUrl(text);
  } catch (e: any) {
    return ctx.reply(`❌ ${e.message}`);
  }

  if (processingUsers.has(userId)) {
    return ctx.reply(s.processing);
  }

  const last = lastRequestTime.get(userId);
  if (last) {
    const secondsLeft = Math.ceil((REQUEST_COOLDOWN_MS - (Date.now() - last)) / 1000);
    if (secondsLeft > 0) {
      return ctx.replyWithHTML(s.cooldown(secondsLeft));
    }
  }

  incrementRequest(userId);
  processingUsers.add(userId);

  const loading = await ctx.reply(s.loading);
  const typingInterval = setInterval(() => {
    ctx.sendChatAction('typing').catch(() => {});
  }, 4000);
  ctx.sendChatAction('typing').catch(() => {});

  try {
    if (parsed.source === 'encar') {
      const data = await fetchEncarData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
      await ctx.replyWithHTML(formatEncarReport(data, false, lang));
      await ctx.replyWithHTML(formatEncarReport(data, true, lang));
    } else if (parsed.source === 'kbcha') {
      const data = await fetchKbchaData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
      if (data.mainPhoto) await ctx.replyWithPhoto(data.mainPhoto);
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, false, lang));
      await ctx.replyWithHTML(formatKbchaReport(data, parsed.id, true, lang));
    } else {
      const data = await fetchKkarData(parsed.id);
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
      if (data.mainPhoto) await ctx.replyWithPhoto(data.mainPhoto);
      await ctx.replyWithHTML(formatKkarReport(data, false, lang));
      await ctx.replyWithHTML(formatKkarReport(data, true, lang));
    }

    const unlimited = getUnlimitedAccess(userId);
    if (!unlimited.active) {
      const balance = getUser(userId).requestBalance;
      if (balance > 0 && balance <= LOW_BALANCE_THRESHOLD) {
        const word = lang === 'en' ? '' : balance === 1 ? s.lowBalanceWord1 : s.lowBalanceWord2;
        await ctx.replyWithHTML(
          s.lowBalanceWarning(balance, word),
          Markup.inlineKeyboard([Markup.button.callback(s.btnEnterKey, 'enter_key')])
        );
      }
    }
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Ошибка для ID ${parsed.id}:`, e.message);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
    await ctx.reply(s.errorData(e.message));
  } finally {
    clearInterval(typingInterval);
    processingUsers.delete(userId);
    lastRequestTime.set(userId, Date.now());
  }
});

bot.catch((err: unknown, ctx) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${new Date().toISOString()}] [bot.catch] Необработанная ошибка для пользователя ${ctx.from?.id} (@${ctx.from?.username ?? '—'}): ${message}`);
  const lang = ctx.from ? getUserLanguage(ctx.from.id) : 'ru';
  ctx.reply(t(lang).unexpectedError).catch(() => {});
});

bot.launch();
console.log('Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
