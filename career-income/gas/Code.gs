const SPREADSHEET_ID = 'ここにスプレッドシートIDを入力';
const SHEET_NAME = '診断回答';

const HEADERS = [
  'サーバー受信日時','回答ID','回答者氏名','クライアント送信日時','年齢','雇用形態','現職','現年収','経験年数','現在の役割','仕事上の成果','希望するキャリア方向','希望勤務地','営業スタイル','商材価格帯','営業成績','保有資格','資格職の希望方向','デジタル職の実務レベル','デジタル職の成果説明','汎用スキル','業務改善経験','診断タイプ','推定年収下限','推定年収上限','現年収中央値','転職実現度','ref','utm_source','utm_medium','utm_campaign','ページURL','参照元URL'
];

function doPost(e) {
  const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e || !e.parameter || !e.parameter.payload) throw new Error('payload is required');
    const data = JSON.parse(e.parameter.payload);
    validatePayload_(data);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet);
      sheet.appendRow(toRow_(data));
    } finally {
      lock.releaseLock();
    }
    return output.setContent(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error(error);
    return output.setContent(JSON.stringify({ ok: false, error: String(error.message || error) }));
  }
}

function validatePayload_(data) {
  if (!data || typeof data !== 'object') throw new Error('invalid payload');
  const name = String(data.fullName || '').trim();
  if (name.replace(/\s/g, '').length < 2 || name.length > 60) throw new Error('invalid fullName');
  if (!data.answers || typeof data.answers !== 'object') throw new Error('answers are required');
  if (!data.result || typeof data.result !== 'object') throw new Error('result is required');
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (HEADERS.some((header, index) => current[index] !== header)) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function toRow_(data) {
  const labels = data.answerLabels || {};
  const result = data.result || {};
  const source = data.source || {};
  return [
    new Date(), safeCell_(data.responseId), safeCell_(data.fullName), safeCell_(data.submittedAtClient),
    safeCell_(labels.age), safeCell_(labels.employment), safeCell_(labels.job), safeCell_(labels.income),
    safeCell_(labels.experience), safeCell_(labels.role), safeCell_(labels.achievement), safeCell_(labels.direction),
    safeCell_(labels.area), safeCell_(labels.salesStyle), safeCell_(labels.priceBand), safeCell_(labels.salesPerformance),
    safeCell_(labels.qualification), safeCell_(labels.licensedDirection), safeCell_(labels.skillLevel), safeCell_(labels.measurableOutcome),
    safeCell_(labels.strength), safeCell_(labels.processImprovement), safeCell_(result.type),
    numberOrBlank_(result.estimatedIncomeLow), numberOrBlank_(result.estimatedIncomeHigh), numberOrBlank_(result.currentIncomeMidpoint), numberOrBlank_(result.feasibility),
    safeCell_(source.ref), safeCell_(source.utmSource), safeCell_(source.utmMedium), safeCell_(source.utmCampaign), safeCell_(source.pageUrl), safeCell_(source.referrer)
  ];
}

function safeCell_(value) {
  const text = value == null ? '' : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function numberOrBlank_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}
