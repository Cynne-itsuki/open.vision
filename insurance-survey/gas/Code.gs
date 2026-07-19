const SHEET_NAME = 'insurance_survey_test';

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
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = getOrCreateSheet_();
    const answers = payload.answers || {};

    sheet.appendRow([
      new Date(),
      payload.submittedAtClient ? new Date(payload.submittedAtClient) : '',
      answers.fullName || '',
      label_('ageRange', answers.ageRange),
      label_('employment', answers.employment),
      label_('annualIncome', answers.annualIncome),
      label_('primaryConcern', answers.primaryConcern),
      label_('consultationIntent', answers.consultationIntent),
      payload.source || '',
      payload.campaign || '',
      payload.referenceId || '',
      payload.pageUrl || ''
    ]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 2).setNumberFormat('yyyy/mm/dd hh:mm:ss');

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
    const headers = [
      '回答受信日時',
      '回答端末日時',
      '氏名',
      '年齢',
      '働き方',
      '本人年収',
      '最も相談したいテーマ',
      '面談で希望すること',
      '流入元',
      'キャンペーン',
      '参照ID',
      '回答ページURL'
    ];

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1f4e78')
      .setFontColor('#ffffff');
    sheet.getRange(1, 1, 1, headers.length).createFilter();
    sheet.setColumnWidths(1, 2, 145);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidths(4, 3, 150);
    sheet.setColumnWidths(7, 2, 230);
    sheet.setColumnWidths(9, 3, 130);
    sheet.setColumnWidth(12, 280);
  }

  return sheet;
}

function label_(field, value) {
  if (!value) return '';
  return (LABELS[field] && LABELS[field][value]) || value;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
