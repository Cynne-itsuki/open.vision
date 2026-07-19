const SHEET_NAME = 'insurance_survey_test';

// スプレッドシートURLの /d/ と /edit の間にあるIDを設定すると確実です。
// スプレッドシートから「拡張機能 → Apps Script」で開いた場合は空欄でも動作します。
const SPREADSHEET_ID = '';
const ALLOWED_ORIGIN = 'https://cynne-itsuki.github.io';

const HEADERS = [
  '回答受信日時',
  '回答端末日時',
  '氏名',
  '年齢',
  '働き方',
  '本人年収',
  '気になること（複数）',
  '面談で希望すること',
  '流入元',
  'キャンペーン',
  '参照ID'
];

const LABELS = {
  ageRange: {
    '18-24': '18〜24歳',
    '25-29': '25〜29歳',
    '30-34': '30〜34歳',
    '35-39': '35〜39歳',
    '40-49': '40〜49歳',
    '50-59': '50〜59歳',
    '60+': '60歳以上'
  },
  employment: {
    employee: '会社員',
    public: '公務員',
    executive: '会社経営者・役員',
    self_employed: '個人事業主・フリーランス',
    part_time: 'パート・アルバイト',
    homemaker: '専業主婦・主夫',
    student: '学生',
    other: '無職・その他'
  },
  annualIncome: {
    lt200: '200万円未満',
    '200-299': '200万〜299万円',
    '300-399': '300万〜399万円',
    '400-499': '400万〜499万円',
    '500-699': '500万〜699万円',
    '700-999': '700万〜999万円',
    '1000-1499': '1,000万〜1,499万円',
    '1500+': '1,500万円以上'
  },
  primaryConcern: {
    protection: '生命保険・医療保険の見直し',
    asset_building: '貯蓄・資産形成について',
    retirement: '老後資金・年金について',
    education: '教育費・家族の将来について',
    household: '家計・固定費について',
    unsure: '何から考えればよいか分からない'
  },
  consultationIntent: {
    specific: '具体的な改善案まで相談したい',
    organize: 'まずは現状と課題を整理したい',
    compare: '他社や現在の提案と比較したい',
    information: '情報収集として話を聞きたい',
    unsure: 'まだ決めていない'
  }
};

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const payload = parsePayload_(e);
    const answers = payload.answers || {};
    const sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      payload.submittedAtClient ? new Date(payload.submittedAtClient) : '',
      answers.fullName || '',
      label_('ageRange', answers.ageRange),
      label_('employment', answers.employment),
      label_('annualIncome', answers.annualIncome),
      labels_('primaryConcern', answers.primaryConcern),
      label_('consultationIntent', answers.consultationIntent),
      payload.source || '',
      payload.campaign || '',
      payload.referenceId || ''
    ]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 2).setNumberFormat('yyyy/mm/dd hh:mm:ss');
    SpreadsheetApp.flush();

    return iframeResponse_({
      type: 'insurance-survey-response',
      ok: true,
      row: lastRow
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);

    return iframeResponse_({
      type: 'insurance-survey-response',
      ok: false,
      error: String(error)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // ロック未取得時は何もしない
    }
  }
}

function doGet() {
  try {
    const sheet = getOrCreateSheet_();
    return json_({
      ok: true,
      service: 'insurance-survey-test',
      sheet: sheet.getName()
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(error)
    });
  }
}

function testConnection() {
  const sheet = getOrCreateSheet_();

  sheet.appendRow([
    new Date(),
    '',
    '接続テスト',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy/mm/dd hh:mm:ss');
  SpreadsheetApp.flush();

  console.log('接続テスト成功: ' + sheet.getParent().getUrl());
}

function parsePayload_(e) {
  if (!e) throw new Error('リクエスト情報がありません。');

  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  throw new Error('回答データがありません。');
}

function getSpreadsheet_() {
  const configuredId = String(SPREADSHEET_ID || '').trim();

  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!activeSpreadsheet) {
    throw new Error(
      '接続先スプレッドシートを特定できません。Code.gsのSPREADSHEET_IDを設定してください。'
    );
  }

  return activeSpreadsheet;
}

function getOrCreateSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1f4e78')
    .setFontColor('#ffffff');

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), HEADERS.length).createFilter();
  }

  sheet.setColumnWidths(1, 2, 145);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidths(4, 3, 150);
  sheet.setColumnWidths(7, 2, 230);
  sheet.setColumnWidths(9, 3, 130);

  return sheet;
}

function label_(field, value) {
  if (!value) return '';
  return (LABELS[field] && LABELS[field][value]) || value;
}

function labels_(field, value) {
  if (!value) return '';

  const values = Array.isArray(value) ? value : [value];
  return values.map(function (item) {
    return label_(field, item);
  }).join('、');
}

function iframeResponse_(data) {
  const script =
    '<!doctype html><html><body><script>' +
    'window.parent.postMessage(' +
    JSON.stringify(data) +
    ',' +
    JSON.stringify(ALLOWED_ORIGIN) +
    ');' +
    '<\/script></body></html>';

  return HtmlService
    .createHtmlOutput(script)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
