export type Lang = 'ru' | 'en';

interface Strings {
  welcome: (freeRequests: number) => string;
  help: (freeRequests: number) => string;
  exampleReport: string;
  contactText: string;

  btnHelp: string;
  btnExample: string;
  btnEnterKey: string;
  btnStatus: string;
  btnContact: string;
  btnLanguage: string;

  statusUnlimited: (expiryLine: string) => string;
  statusBalance: (balance: number) => string;
  statusExpiresAt: (date: string) => string;

  keyPrompt: string;
  keyTimeout: string;
  keyInvalidFormat: string;
  keyBanned: (minutesLeft: number) => string;
  keyAcceptedCredits: (credited: number, balance: number) => string;
  keyAcceptedUnlimited: (expiryLine: string) => string;
  keyExpiredUnlimitedLine: (date: string) => string;
  keyNotFound: (remaining: number) => string;
  keyAlreadyBound: (remaining: number) => string;
  keyExpired: string;
  keyAlreadyActivated: string;
  keyBannedTooManyAttempts: string;

  balanceExhausted: string;
  processing: string;
  cooldown: (seconds: number) => string;
  loading: string;
  errorData: (msg: string) => string;
  unexpectedError: string;

  // Admin
  adminKeyCreated: (key: string, limitLine: string, expiryLine: string) => string;
  adminKeyLimitUnlimited: string;
  adminKeyLimitN: (n: number) => string;
  adminKeyExpiryNone: string;
  adminKeyExpiryDate: (date: string) => string;
  adminKeyRevoked: (key: string) => string;
  adminKeyNotFound: string;
  adminBalanceAdded: (userId: number, amount: number, newBalance: number) => string;
  adminUsageInvalid: (cmd: string) => string;
  adminUserNotFound: string;

  // Report labels (formatters)
  reportMainData: string;
  reportPlate: string;
  reportVin: string;
  reportYear: string;
  reportMileage: string;
  reportPrice: string;
  reportTransmission: string;
  reportFuel: string;
  reportEngine: string;
  reportColor: string;
  reportAddress: string;
  reportPhone: string;
  reportRegion: string;
  reportDrive: string;
  reportInsuranceHistory: string;
  reportCleanHistory: string;
  reportNoData: string;
  reportAccidentFault: (cnt: number, cost: string) => string;
  reportAccidentVictim: (cnt: number, cost: string) => string;
  reportTotalLoss: (cnt: number) => string;
  reportFloodLoss: (cnt: number) => string;
  reportTheft: (cnt: number) => string;
  reportOwnerChange: (cnt: number) => string;
  reportRentHistory: string;
  reportBizUseHistory: string;
  reportFirstReg: string;
  reportAccidents: string;
  reportAccidentsNone: string;
  reportAccidentsYes: string;
  reportInspection: string;
  reportUsageHistory: string;
  reportProblematicItems: string;
  reportNodesOk: string;
  reportBodyOk: string;
  reportBodyDamages: string;
  reportSeller: string;
  reportDealer: string;
  reportCompany: string;
  reportCenter: string;
  reportPlace: string;

  // Short report labels
  shortNoInsurance: string;
  shortHasAccidents: string;
  shortInsuranceCost: (cost: string) => string;

  // Low balance warning
  lowBalanceWarning: (balance: number, word: string) => string;
  lowBalanceWord1: string;
  lowBalanceWord2: string;

  languageChanged: string;
  languageSelect: string;
}

const RU: Strings = {
  welcome: (n) =>
    `<b>Добро пожаловать в Car Analyzer!</b>\n\n` +
    `Этот бот помогает проверить автомобиль перед покупкой на корейских площадках.\n\n` +
    `<b>Что умеет бот:</b>\n` +
    `• Отчёт по истории страхования и ДТП\n` +
    `• Данные технического осмотра\n` +
    `• Пробег, год выпуска, комплектация\n\n` +
    `<b>Поддерживаемые площадки:</b>\n` +
    `• encar.com\n• kbchachacha.com\n• kcar.com\n\n` +
    `Просто отправь ссылку на автомобиль — бот сделает всё остальное.\n\n` +
    `🌐 <b>Наша площадка:</b> <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
    `<i>Каждому пользователю доступно ${n} бесплатных запросов. Пополнить баланс можно через ключ активации.</i>`,

  help: (n) =>
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
    `Каждому пользователю доступно ${n} бесплатных запросов. Пополнить баланс можно через ключ активации — пишите <a href="https://t.me/caparts">@caparts</a> или заходите на <a href="https://www.kmotors.shop/">kmotors.shop</a>`,

  exampleReport:
    `<b>📋 Пример отчёта</b>\n` +
    `<i>Так выглядит отчёт по автомобилю с нашего бота:</i>\n\n` +
    `🚗 <b>Kia Ray</b>\nДирекс Спесел\n` +
    `<a href="https://www.encar.com/dc/dc_cardetailview.do?carid=40839556">encar.com/dc/dc_cardetailview.do?carid=40839556</a>\n\n` +
    `📋 <b>Основные данные</b>\n` +
    `Номер авто:  <b>66보9144</b>\nVIN:         <b>KNACH811BDT050022</b>\n` +
    `Год выпуска: <b>2013</b>\nПробег:      <b>93 801 км</b>\nЦена:        <b>5 390 000 ₩</b>\n` +
    `КПП:         Автомат (오토)\nТопливо:     Бензин (가솔린)\nДвигатель:   1.0л\n` +
    `Цвет:        Голубой (하늘색)\nАдрес:       충남 천안시 동남구\n\n` +
    `🔍 <b>Страховая история</b>\n` +
    `⚠️ Аварий (виновник): 2 — 5 140 820 ₩\n⚠️ Аварий (пострадавший): 1 — 360 598 ₩\nПервая рег.: 2013-01-18\n\n` +
    `🔧 <b>Техническая инспекция</b>\nУзлы: ✅ Всё в норме\nКузовные повреждения:\n` +
    `🔴 Переднее крыло (пр.): Замена\n🔴 Капот: Замена\n🔴 Крышка багажника: Замена\n` +
    `🔴 Переднее крыло (лев.): Замена\n⚠️ Порог панель (лев.): Рихтовка/сварка\n⚠️ Задняя панель: Замена`,

  contactText:
    `<b>💬 Связаться с нами</b>\n\n` +
    `Telegram: <a href="https://t.me/caparts">@caparts</a>\n` +
    `Сайт: <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
    `<i>По вопросам ключей активации, сотрудничества и помощи — пишите нам.</i>`,

  btnHelp: '❓ Как пользоваться',
  btnExample: '📋 Пример отчёта',
  btnEnterKey: '🔑 Ввести ключ',
  btnStatus: '📊 Мой статус',
  btnContact: '💬 Связаться с нами',
  btnLanguage: '🌐 English',

  statusUnlimited: (expiryLine) => `✅ Безлимитный доступ активирован.${expiryLine}`,
  statusBalance: (b) => `🔢 Остаток запросов: <b>${b}</b>`,
  statusExpiresAt: (d) => `\n📅 Действителен до: <b>${d}</b>`,

  keyPrompt: 'Отправь свой ключ активации (формат: XXXX-XXXX-XXXX):\n⏱ У тебя есть 5 минут.',
  keyTimeout: '⌛ Время ввода ключа истекло. Нажми кнопку снова если хочешь попробовать.',
  keyInvalidFormat: '❌ Неверный формат ключа. Ожидается: XXXX-XXXX-XXXX',
  keyBanned: (m) => `🚫 Ввод ключей заблокирован. Попробуй через <b>${m} мин.</b>`,
  keyAcceptedCredits: (c, b) => `✅ Ключ принят! Начислено <b>${c}</b> запросов.\n🔢 Баланс: <b>${b}</b>`,
  keyAcceptedUnlimited: (expiryLine) => `✅ Безлимитный доступ активирован!${expiryLine}`,
  keyExpiredUnlimitedLine: (d) => `\n📅 Действителен до: <b>${d}</b>`,
  keyNotFound: (r) => `❌ Ключ не найден. Осталось попыток: <b>${r}</b>`,
  keyAlreadyBound: (r) => `❌ Ключ уже используется другим пользователем. Осталось попыток: <b>${r}</b>`,
  keyExpired: '❌ Срок действия ключа истёк.',
  keyAlreadyActivated: 'ℹ️ Этот ключ уже активирован тобой.',
  keyBannedTooManyAttempts: '🚫 Превышен лимит попыток. Ввод ключей заблокирован на 30 минут.',

  balanceExhausted: `Баланс запросов исчерпан.\n\nПополни баланс через ключ активации. По вопросам пиши <a href="https://t.me/caparts">@caparts</a>`,
  processing: '⏳ Подожди, ещё обрабатываю предыдущий запрос.',
  cooldown: (s) => `⏱ Подожди ещё <b>${s} сек.</b> перед следующим запросом.`,
  loading: '⏳ Загружаю данные...',
  errorData: (msg) => `❌ Ошибка при получении данных: ${msg}`,
  unexpectedError: '❌ Произошла неожиданная ошибка. Попробуй ещё раз или напиши нам: @caparts',

  adminKeyCreated: (key, limitLine, expiryLine) =>
    `🔑 Новый ключ активации:\n\n<code>${key}</code>\n\n${limitLine}\n${expiryLine}`,
  adminKeyLimitUnlimited: '🔢 Лимит: <b>безлимит</b>',
  adminKeyLimitN: (n) => `🔢 Лимит: <b>${n}</b> запросов`,
  adminKeyExpiryNone: '📅 Срок: <b>бессрочный</b>',
  adminKeyExpiryDate: (d) => `📅 Истекает: <b>${d}</b>`,
  adminKeyRevoked: (key) => `✅ Ключ <code>${key}</code> отозван.`,
  adminKeyNotFound: '❌ Ключ не найден.',
  adminBalanceAdded: (uid, amount, bal) =>
    `✅ Пользователю <code>${uid}</code> начислено <b>${amount}</b> запросов.\nНовый баланс: <b>${bal}</b>`,
  adminUsageInvalid: (cmd) => `Использование: ${cmd}`,
  adminUserNotFound: '❌ Пользователь не найден.',

  reportMainData: '📋 <b>Основные данные</b>',
  reportPlate: 'Номер авто:',
  reportVin: 'VIN:',
  reportYear: 'Год выпуска:',
  reportMileage: 'Пробег:',
  reportPrice: 'Цена:',
  reportTransmission: 'КПП:',
  reportFuel: 'Топливо:',
  reportEngine: 'Двигатель:',
  reportColor: 'Цвет:',
  reportAddress: 'Адрес:',
  reportPhone: 'Тел.:',
  reportRegion: 'Регион:',
  reportDrive: 'Привод:',
  reportInsuranceHistory: '🔍 <b>Страховая история</b>',
  reportCleanHistory: '✅ Чистая история',
  reportNoData: '⚠️ Данные недоступны',
  reportAccidentFault: (cnt, cost) => `⚠️ Аварий (виновник): ${cnt} — ${cost}₩`,
  reportAccidentVictim: (cnt, cost) => `⚠️ Аварий (пострадавший): ${cnt} — ${cost}₩`,
  reportTotalLoss: (cnt) => `🚨 Тотальные потери: ${cnt}`,
  reportFloodLoss: (cnt) => `🚨 Потоп (тотал): ${cnt}`,
  reportTheft: (cnt) => `🚨 Угон: ${cnt}`,
  reportOwnerChange: (cnt) => `⚠️ Смена владельца: ${cnt}`,
  reportRentHistory: '⚠️ История проката',
  reportBizUseHistory: '⚠️ Коммерческое использование',
  reportFirstReg: 'Первая рег.:',
  reportAccidents: 'Аварии:',
  reportAccidentsNone: '✅ Нет',
  reportAccidentsYes: '⚠️ Есть',
  reportInspection: '🔧 <b>Техническая инспекция</b>',

  reportUsageHistory: 'История исп.:',
  reportProblematicItems: 'Проблемные узлы:',
  reportNodesOk: 'Узлы:            ✅ Всё в норме',
  reportBodyOk: 'Кузов (панели):  ✅ Без повреждений',
  reportBodyDamages: 'Кузовные повреждения:',
  reportSeller: '👤 <b>Продавец</b>',
  reportDealer: 'Дилер:',
  reportCompany: 'Компания:',
  reportCenter: 'Центр:',
  reportPlace: 'Место:',

  shortNoInsurance: '✅ страховых нет',
  shortHasAccidents: '⚠️ Есть аварии',
  shortInsuranceCost: (cost) => `страховых на ${cost}₩`,

  lowBalanceWarning: (b, word) => `⚠️ Осталось <b>${b}</b> ${word}. Пополни баланс через ключ активации.`,
  lowBalanceWord1: 'запрос',
  lowBalanceWord2: 'запроса',

  languageChanged: '✅ Язык изменён на русский.',
  languageSelect: '🌐 Выбери язык / Choose language:',
};

const EN: Strings = {
  welcome: (n) =>
    `<b>Welcome to Car Analyzer!</b>\n\n` +
    `This bot helps you check Korean used cars before buying.\n\n` +
    `<b>What the bot does:</b>\n` +
    `• Insurance & accident history report\n` +
    `• Technical inspection data\n` +
    `• Mileage, year, trim level\n\n` +
    `<b>Supported platforms:</b>\n` +
    `• encar.com\n• kbchachacha.com\n• kcar.com\n\n` +
    `Just send a car listing link — the bot will do the rest.\n\n` +
    `🌐 <b>Our marketplace:</b> <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
    `<i>Every user gets ${n} free requests. Add more via an activation key.</i>`,

  help: (n) =>
    `<b>❓ How to use</b>\n\n` +
    `1. Go to one of the supported platforms\n` +
    `2. Open any car listing page\n` +
    `3. Copy the URL from the address bar\n` +
    `4. Send the URL to this chat\n\n` +
    `<b>Example URLs:</b>\n` +
    `• <code>https://www.encar.com/dc/dc_cardetailview.do?carid=12345678</code>\n` +
    `• <code>https://www.kbchachacha.com/public/car/detail.kbc?carSeq=12345678</code>\n` +
    `• <code>https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=ABC1234</code>\n\n` +
    `<b>Request balance:</b>\n` +
    `Every user gets ${n} free requests. Add more via an activation key — contact <a href="https://t.me/caparts">@caparts</a> or visit <a href="https://www.kmotors.shop/">kmotors.shop</a>`,

  exampleReport:
    `<b>📋 Sample report</b>\n` +
    `<i>This is what a report from our bot looks like:</i>\n\n` +
    `🚗 <b>Kia Ray</b>\nDirects Special\n` +
    `<a href="https://www.encar.com/dc/dc_cardetailview.do?carid=40839556">encar.com/dc/dc_cardetailview.do?carid=40839556</a>\n\n` +
    `📋 <b>Main data</b>\n` +
    `Plate:       <b>66보9144</b>\nVIN:         <b>KNACH811BDT050022</b>\n` +
    `Year:        <b>2013</b>\nMileage:     <b>93,801 km</b>\nPrice:       <b>5,390,000 ₩</b>\n` +
    `Gearbox:     Automatic (오토)\nFuel:        Gasoline (가솔린)\nEngine:      1.0L\n` +
    `Color:       Sky Blue (하늘색)\nAddress:     충남 천안시 동남구\n\n` +
    `🔍 <b>Insurance history</b>\n` +
    `⚠️ At-fault accidents: 2 — 5,140,820 ₩\n⚠️ Victim accidents: 1 — 360,598 ₩\nFirst reg.: 2013-01-18\n\n` +
    `🔧 <b>Technical inspection</b>\nMechanical: ✅ All OK\nBody damage:\n` +
    `🔴 Front fender (R): Replaced\n🔴 Hood: Replaced\n🔴 Trunk lid: Replaced\n` +
    `🔴 Front fender (L): Replaced\n⚠️ Side sill panel (L): Panel beating/welding\n⚠️ Rear panel: Replaced`,

  contactText:
    `<b>💬 Contact us</b>\n\n` +
    `Telegram: <a href="https://t.me/caparts">@caparts</a>\n` +
    `Website: <a href="https://www.kmotors.shop/">kmotors.shop</a>\n\n` +
    `<i>For activation keys, partnerships or help — write to us.</i>`,

  btnHelp: '❓ How to use',
  btnExample: '📋 Sample report',
  btnEnterKey: '🔑 Enter key',
  btnStatus: '📊 My status',
  btnContact: '💬 Contact us',
  btnLanguage: '🌐 Русский',

  statusUnlimited: (expiryLine) => `✅ Unlimited access activated.${expiryLine}`,
  statusBalance: (b) => `🔢 Requests remaining: <b>${b}</b>`,
  statusExpiresAt: (d) => `\n📅 Valid until: <b>${d}</b>`,

  keyPrompt: 'Send your activation key (format: XXXX-XXXX-XXXX):\n⏱ You have 5 minutes.',
  keyTimeout: '⌛ Key entry timed out. Press the button again if you want to try.',
  keyInvalidFormat: '❌ Invalid key format. Expected: XXXX-XXXX-XXXX',
  keyBanned: (m) => `🚫 Key entry is blocked. Try again in <b>${m} min.</b>`,
  keyAcceptedCredits: (c, b) => `✅ Key accepted! <b>${c}</b> requests added.\n🔢 Balance: <b>${b}</b>`,
  keyAcceptedUnlimited: (expiryLine) => `✅ Unlimited access activated!${expiryLine}`,
  keyExpiredUnlimitedLine: (d) => `\n📅 Valid until: <b>${d}</b>`,
  keyNotFound: (r) => `❌ Key not found. Attempts left: <b>${r}</b>`,
  keyAlreadyBound: (r) => `❌ Key is already used by another user. Attempts left: <b>${r}</b>`,
  keyExpired: '❌ This key has expired.',
  keyAlreadyActivated: 'ℹ️ You have already activated this key.',
  keyBannedTooManyAttempts: '🚫 Too many attempts. Key entry blocked for 30 minutes.',

  balanceExhausted: `Your request balance is empty.\n\nAdd more via an activation key. Contact <a href="https://t.me/caparts">@caparts</a>`,
  processing: '⏳ Please wait, still processing your previous request.',
  cooldown: (s) => `⏱ Please wait <b>${s} more sec.</b> before the next request.`,
  loading: '⏳ Loading data...',
  errorData: (msg) => `❌ Error fetching data: ${msg}`,
  unexpectedError: '❌ An unexpected error occurred. Try again or contact us: @caparts',

  adminKeyCreated: (key, limitLine, expiryLine) =>
    `🔑 New activation key:\n\n<code>${key}</code>\n\n${limitLine}\n${expiryLine}`,
  adminKeyLimitUnlimited: '🔢 Limit: <b>unlimited</b>',
  adminKeyLimitN: (n) => `🔢 Limit: <b>${n}</b> requests`,
  adminKeyExpiryNone: '📅 Expires: <b>never</b>',
  adminKeyExpiryDate: (d) => `📅 Expires: <b>${d}</b>`,
  adminKeyRevoked: (key) => `✅ Key <code>${key}</code> revoked.`,
  adminKeyNotFound: '❌ Key not found.',
  adminBalanceAdded: (uid, amount, bal) =>
    `✅ Added <b>${amount}</b> requests to user <code>${uid}</code>.\nNew balance: <b>${bal}</b>`,
  adminUsageInvalid: (cmd) => `Usage: ${cmd}`,
  adminUserNotFound: '❌ User not found.',

  reportMainData: '📋 <b>Main data</b>',
  reportPlate: 'Plate:',
  reportVin: 'VIN:',
  reportYear: 'Year:',
  reportMileage: 'Mileage:',
  reportPrice: 'Price:',
  reportTransmission: 'Gearbox:',
  reportFuel: 'Fuel:',
  reportEngine: 'Engine:',
  reportColor: 'Color:',
  reportAddress: 'Address:',
  reportPhone: 'Phone:',
  reportRegion: 'Region:',
  reportDrive: 'Drive:',
  reportInsuranceHistory: '🔍 <b>Insurance history</b>',
  reportCleanHistory: '✅ Clean history',
  reportNoData: '⚠️ Data unavailable',
  reportAccidentFault: (cnt, cost) => `⚠️ At-fault accidents: ${cnt} — ${cost}₩`,
  reportAccidentVictim: (cnt, cost) => `⚠️ Victim accidents: ${cnt} — ${cost}₩`,
  reportTotalLoss: (cnt) => `🚨 Total loss: ${cnt}`,
  reportFloodLoss: (cnt) => `🚨 Flood total loss: ${cnt}`,
  reportTheft: (cnt) => `🚨 Theft: ${cnt}`,
  reportOwnerChange: (cnt) => `⚠️ Owner changes: ${cnt}`,
  reportRentHistory: '⚠️ Rental history',
  reportBizUseHistory: '⚠️ Commercial use history',
  reportFirstReg: 'First reg.:',
  reportAccidents: 'Accidents:',
  reportAccidentsNone: '✅ None',
  reportAccidentsYes: '⚠️ Yes',
  reportInspection: '🔧 <b>Technical inspection</b>',
  reportUsageHistory: 'Usage history:',
  reportProblematicItems: 'Problem items:',
  reportNodesOk: 'Mechanical:      ✅ All OK',
  reportBodyOk: 'Body panels:     ✅ No damage',
  reportBodyDamages: 'Body damage:',
  reportSeller: '👤 <b>Seller</b>',
  reportDealer: 'Dealer:',
  reportCompany: 'Company:',
  reportCenter: 'Center:',
  reportPlace: 'Location:',

  shortNoInsurance: '✅ no insurance claims',
  shortHasAccidents: '⚠️ Accidents found',
  shortInsuranceCost: (cost) => `insurance claims ${cost}₩`,

  lowBalanceWarning: (b, _word) => `⚠️ Only <b>${b}</b> ${b === 1 ? 'request' : 'requests'} left. Add more via an activation key.`,
  lowBalanceWord1: '',
  lowBalanceWord2: '',

  languageChanged: '✅ Language changed to English.',
  languageSelect: '🌐 Выбери язык / Choose language:',
};

export const i18n: Record<Lang, Strings> = { ru: RU, en: EN };

export function t(lang: Lang): Strings {
  return i18n[lang];
}
