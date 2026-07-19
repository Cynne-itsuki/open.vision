const SHEET_NAME = 'insurance_survey_test';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = getOrCreateSheet_();
    const answers = payload.answers || {};

    sheet.appendRow([
      new Date(),
      payload.submittedAtClient || '',
      payload.source || '',
      payload.campaign || '',
      payload.referenceId || '',
      answers.fullName || '',
      answers.ageRange || '',
      answers.employment || '',
      answers.annualIncome || '',
      answers.primaryConcern || '',
      answers.consultationIntent || '',
      payload.pageUrl || ''
    ]);

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'insurance-survey-test' });
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'サーバー受信日時',
      '回答端末日時',
      '流入元',
      'キャンペーン',
      '参照ID',
      '氏名',
      '年齢',
      '働き方',
      '本人年収',
      '最も相談したいテーマ',
      '面談で希望すること',
      '回答ページURL'
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
