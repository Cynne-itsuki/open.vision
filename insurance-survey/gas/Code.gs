const SHEET_NAME = 'insurance_survey';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = getOrCreateSheet_();
    const answers = payload.answers || {};
    const routing = payload.routing || {};

    sheet.appendRow([
      new Date(),
      payload.submittedAtClient || '',
      payload.source || '',
      payload.campaign || '',
      payload.referenceId || '',
      answers.fullName || '',
      answers.ageRange || '',
      answers.employment || '',
      answers.familyStatus || '',
      answers.annualIncome || '',
      answers.financialAssets || '',
      answers.lumpSumCapacity || '',
      answers.monthlyCapacity || '',
      answers.debtStatus || '',
      answers.insuranceStatus || '',
      answers.monthlyPremium || '',
      answers.investmentExperience || '',
      answers.primaryConcern || '',
      answers.consultationIntent || '',
      answers.timing || '',
      answers.consent === true ? '同意' : '未同意',
      (routing.routeTags || []).join(','),
      routing.readiness || '',
      payload.pageUrl || ''
    ]);

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'insurance-survey' });
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'サーバー受信日時', '回答端末日時', '流入元', 'キャンペーン', '参照ID',
      '氏名', '年齢', '働き方', '家族構成', '本人年収', '金融資産',
      '運用可能なまとまった資金', '毎月の資産形成余力', '借入状況',
      '保険加入状況', '月額保険料', '資産形成経験', '主な相談テーマ',
      '面談への期待', '検討時期', '同意', '振り分けタグ', '検討温度', '回答ページURL'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
