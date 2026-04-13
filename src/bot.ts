import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { parseCarUrl } from './router';
import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';
import { fetchKbchaData } from './scrapers/kbcha';
import { formatKbchaReport } from './formatters/kbchaReport';
import { fetchKkarData } from './scrapers/kkar';
import { formatKkarReport } from './formatters/kkarReport';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не задан в .env');

const bot = new Telegraf(token);

bot.start((ctx) =>
  ctx.reply(
    'Привет! Отправь мне ссылку на автомобиль с Encar, и я подготовлю отчёт.\n\n' +
    'Поддерживаемые источники:\n' +
    '• encar.com\n' +
    '• kbchachacha.com\n' +
    '• kkar.com',
  ),
);

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();

  let parsed;
  try {
    parsed = parseCarUrl(text);
  } catch (e: any) {
    return ctx.reply(`❌ ${e.message}`);
  }


  const loading = await ctx.reply('⏳ Загружаю данные...');

  try {
    let report: string;

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
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    await ctx.reply(`❌ Ошибка при получении данных: ${e.message}`);
  }
});

bot.launch();
console.log('Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
