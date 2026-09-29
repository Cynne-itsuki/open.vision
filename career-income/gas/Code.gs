const SPREADSHEET_ID = 'ここにスプレッドシートIDを入力';
const SHEET_NAME = '診断回答';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const ALLOWED_PARENT_ORIGIN = 'https://cynne-itsuki.github.io';

const HEADERS = [
  'サーバー受信日時', '回答ID', 'リクエストID', '回答者氏名', 'クライアント送信日時',
  '年齢', '雇用形態', '現職', '現年収', '経験年数', '現在の役割', '仕事上の成果', '希望するキャリア方向', '希望勤務地',
  '営業スタイル', '商材価格帯', '営業成績', '保有資格', '資格職の希望方向', 'デジタル職の実務レベル', 'デジタル職の成果説明', '汎用スキル', '業務改善経験',
  '仕事内容・役割（自由記述）', '成果（自由記述）', '転職で実現したいこと（自由記述）',
  '基本診断タイプ', '基本年収下限', '基本年収上限', '基本転職実現度',
  'AI分析利用', 'AIモデル', '経験の深さ', '数字を伴う成果', '成果の再現性', '専門性', 'マネジメント', '希望職種との整合性',
  'AI年収補正下限', 'AI年収補正上限', 'AI実現度補正', 'AI抽出根拠', 'AIエラー',
  '最終診断タイプ', '最終要約', '最終年収下限', '最終年収上限', '現年収中央値', '最終転職実現度', '強み', '改善ポイント', 'キャリア方向性',
  'ref', 'utm_source', 'utm_medium', 'utm_campaign', 'ページURL', '参照元URL'
];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'career-income-diagnosis', model: GEMINI_MODEL }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data = null;
  let requestId = '';
  let finalResult = null;
  let aiAnalysis = fallbackAiAnalysis_('not started');
  let saved = false;
  let errorMessage = '';

  try {
    if (!e || !e.parameter || !e.parameter.payload) throw new Error('payload is required');
    data = JSON.parse(e.parameter.payload);
    validatePayload_(data);
    requestId = String(data.requestId || '');

    const baseResult = sanitizeBaseResult_(data.baseResult);
    try {
      aiAnalysis = analyzeWithGemini_(data);
    } catch (aiError) {
      console.error(aiError);
      aiAnalysis = fallbackAiAnalysis_(String(aiError.message || aiError));
    }

    finalResult = mergeResult_(baseResult, aiAnalysis);

    try {
      appendResponse_(data, baseResult, aiAnalysis, finalResult);
      saved = true;
    } catch (saveError) {
      console.error(saveError);
      errorMessage = 'スプレッドシート保存エラー: ' + String(saveError.message || saveError);
    }

    return postMessageOutput_({
      source: 'career-income-diagnosis',
      requestId: requestId,
      ok: true,
      saved: saved,
      result: finalResult,
      error: errorMessage
    });
  } catch (error) {
    console.error(error);
    return postMessageOutput_({
      source: 'career-income-diagnosis',
      requestId: requestId,
      ok: false,
      saved: false,
      result: finalResult,
      error: String(error.message || error)
    });
  }
}

function analyzeWithGemini_(data) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const prompt = buildPrompt_(data);
  const schema = {
    type: 'OBJECT',
    properties: {
      experienceScore: { type: 'INTEGER', minimum: 0, maximum: 15 },
      achievementScore: { type: 'INTEGER', minimum: 0, maximum: 20 },
      reproducibilityScore: { type: 'INTEGER', minimum: 0, maximum: 15 },
      specialtyScore: { type: 'INTEGER', minimum: 0, maximum: 15 },
      managementScore: { type: 'INTEGER', minimum: 0, maximum: 15 },
      careerFitScore: { type: 'INTEGER', minimum: 0, maximum: 10 },
      salaryAdjustmentLow: { type: 'INTEGER', minimum: -30, maximum: 60 },
      salaryAdjustmentHigh: { type: 'INTEGER', minimum: -20, maximum: 80 },
      feasibilityAdjustment: { type: 'INTEGER', minimum: -10, maximum: 15 },
      summary: { type: 'STRING' },
      strengths: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 2, maxItems: 4 },
      actions: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 2, maxItems: 4 },
      directions: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 2, maxItems: 4 },
      evidence: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 1, maxItems: 5 }
    },
    required: [
      'experienceScore', 'achievementScore', 'reproducibilityScore', 'specialtyScore', 'managementScore', 'careerFitScore',
      'salaryAdjustmentLow', 'salaryAdjustmentHigh', 'feasibilityAdjustment', 'summary', 'strengths', 'actions', 'directions', 'evidence'
    ]
  };

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 1200,
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  };

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(GEMINI_MODEL) + ':generateContent';
  const responseJson = fetchGeminiWithRetry_(endpoint, apiKey, requestBody);
  const text = (((responseJson.candidates || [])[0] || {}).content || {}).parts;
  if (!Array.isArray(text) || !text.length || !text[0].text) throw new Error('Gemini response text is empty');

  const parsed = JSON.parse(text[0].text);
  return sanitizeAiAnalysis_(parsed);
}

function fetchGeminiWithRetry_(endpoint, apiKey, requestBody) {
  const delays = [0, 1800, 4200];
  let lastError = null;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) Utilities.sleep(delays[attempt]);
    try {
      const response = UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-goog-api-key': apiKey },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });
      const status = response.getResponseCode();
      const body = response.getContentText();
      if (status >= 200 && status < 300) return JSON.parse(body);

      lastError = new Error('Gemini HTTP ' + status + ': ' + body.slice(0, 500));
      if (status !== 429 && status < 500) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === delays.length - 1) break;
    }
  }

  throw lastError || new Error('Gemini request failed');
}

function buildPrompt_(data) {
  const labels = data.answerLabels || {};
  const narratives = data.narratives || {};
  const safeNarratives = {
    workDetails: redactPersonalInfo_(narratives.workDetails),
    achievementDetails: redactPersonalInfo_(narratives.achievementDetails),
    careerGoal: redactPersonalInfo_(narratives.careerGoal)
  };

  return [
    'あなたは日本の20代〜30代前半を中心とした転職市場の職務経歴評価担当です。',
    '以下の選択回答と自由記述を読み、自由記述から確認できる追加情報だけを評価してください。',
    '選択回答ですでに評価されている内容を過度に二重加点しないでください。',
    '年収補正は現実的かつ保守的にし、根拠が曖昧な自己評価は加点しないでください。',
    '会社名・人物名などの個人識別情報は評価に使用せず、出力にも含めないでください。',
    '',
    '【選択回答】',
    JSON.stringify(labels, null, 2),
    '',
    '【自由記述】',
    JSON.stringify(safeNarratives, null, 2),
    '',
    '【評価基準】',
    '- experienceScore: 業務範囲・責任範囲・自走度 0〜15',
    '- achievementScore: 売上、件数、達成率、順位、改善率など客観的成果 0〜20',
    '- reproducibilityScore: 成果を出した方法や工夫が説明されているか 0〜15',
    '- specialtyScore: 専門知識、資格、業界知識、扱った商材やツール 0〜15',
    '- managementScore: 教育、進捗管理、チーム・予算管理 0〜15',
    '- careerFitScore: 現在の経験と希望する転職方向の整合性 0〜10',
    '- salaryAdjustmentLow: 自由記述による年収下限補正。-30〜+60万円',
    '- salaryAdjustmentHigh: 自由記述による年収上限補正。-20〜+80万円',
    '- feasibilityAdjustment: 転職実現度の補正。-10〜+15ポイント',
    '- summary: 120文字以内。断定・保証表現を避ける',
    '- strengths/actions/directions: 各2〜4項目。回答に即した具体的な内容',
    '- evidence: 判断に使用した事実を1〜5項目。自由記述にない事実を作らない',
    '',
    '金額は10万円単位で返してください。JSONスキーマに厳密に従ってください。'
  ].join('\n');
}

function sanitizeAiAnalysis_(value) {
  return {
    used: true,
    model: GEMINI_MODEL,
    experienceScore: clampNumber_(value.experienceScore, 0, 15),
    achievementScore: clampNumber_(value.achievementScore, 0, 20),
    reproducibilityScore: clampNumber_(value.reproducibilityScore, 0, 15),
    specialtyScore: clampNumber_(value.specialtyScore, 0, 15),
    managementScore: clampNumber_(value.managementScore, 0, 15),
    careerFitScore: clampNumber_(value.careerFitScore, 0, 10),
    salaryAdjustmentLow: round10_(clampNumber_(value.salaryAdjustmentLow, -30, 60)),
    salaryAdjustmentHigh: round10_(clampNumber_(value.salaryAdjustmentHigh, -20, 80)),
    feasibilityAdjustment: Math.round(clampNumber_(value.feasibilityAdjustment, -10, 15)),
    summary: safeText_(value.summary, 500),
    strengths: safeArray_(value.strengths, 4),
    actions: safeArray_(value.actions, 4),
    directions: safeArray_(value.directions, 4),
    evidence: safeArray_(value.evidence, 5),
    error: ''
  };
}

function fallbackAiAnalysis_(error) {
  return {
    used: false,
    model: GEMINI_MODEL,
    experienceScore: '', achievementScore: '', reproducibilityScore: '', specialtyScore: '', managementScore: '', careerFitScore: '',
    salaryAdjustmentLow: 0, salaryAdjustmentHigh: 0, feasibilityAdjustment: 0,
    summary: '', strengths: [], actions: [], directions: [], evidence: [], error: String(error || '')
  };
}

function mergeResult_(base, ai) {
  const low = Math.max(200, round10_(base.low + ai.salaryAdjustmentLow));
  const high = Math.max(low + 30, round10_(base.high + ai.salaryAdjustmentHigh));
  const feasibility = Math.round(clampNumber_(base.feasibility + ai.feasibilityAdjustment, 25, 95));

  return {
    type: base.type,
    summary: ai.used && ai.summary ? ai.summary : base.summary,
    currentIncome: base.currentIncome,
    low: low,
    high: high,
    feasibility: feasibility,
    strengths: ai.used && ai.strengths.length ? ai.strengths : base.strengths,
    actions: ai.used && ai.actions.length ? ai.actions : base.actions,
    directions: ai.used && ai.directions.length ? ai.directions : base.directions,
    aiUsed: ai.used,
    aiModel: ai.used ? ai.model : '',
    aiScores: {
      experience: ai.experienceScore,
      achievement: ai.achievementScore,
      reproducibility: ai.reproducibilityScore,
      specialty: ai.specialtyScore,
      management: ai.managementScore,
      careerFit: ai.careerFitScore
    }
  };
}

function appendResponse_(data, base, ai, finalResult) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    ensureHeaders_(sheet);
    sheet.appendRow(toRow_(data, base, ai, finalResult));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (HEADERS.some(function(header, index) { return current[index] !== header; })) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function toRow_(data, base, ai, finalResult) {
  const labels = data.answerLabels || {};
  const narratives = data.narratives || {};
  const source = data.source || {};
  return [
    new Date(), safeCell_(data.responseId), safeCell_(data.requestId), safeCell_(data.fullName), safeCell_(data.submittedAtClient),
    safeCell_(labels.age), safeCell_(labels.employment), safeCell_(labels.job), safeCell_(labels.income), safeCell_(labels.experience), safeCell_(labels.role), safeCell_(labels.achievement), safeCell_(labels.direction), safeCell_(labels.area),
    safeCell_(labels.salesStyle), safeCell_(labels.priceBand), safeCell_(labels.salesPerformance), safeCell_(labels.qualification), safeCell_(labels.licensedDirection), safeCell_(labels.skillLevel), safeCell_(labels.measurableOutcome), safeCell_(labels.strength), safeCell_(labels.processImprovement),
    safeCell_(narratives.workDetails), safeCell_(narratives.achievementDetails), safeCell_(narratives.careerGoal),
    safeCell_(base.type), numberOrBlank_(base.low), numberOrBlank_(base.high), numberOrBlank_(base.feasibility),
    ai.used ? 'TRUE' : 'FALSE', safeCell_(ai.model), numberOrBlank_(ai.experienceScore), numberOrBlank_(ai.achievementScore), numberOrBlank_(ai.reproducibilityScore), numberOrBlank_(ai.specialtyScore), numberOrBlank_(ai.managementScore), numberOrBlank_(ai.careerFitScore),
    numberOrBlank_(ai.salaryAdjustmentLow), numberOrBlank_(ai.salaryAdjustmentHigh), numberOrBlank_(ai.feasibilityAdjustment), safeCell_(JSON.stringify(ai.evidence || [])), safeCell_(ai.error),
    safeCell_(finalResult.type), safeCell_(finalResult.summary), numberOrBlank_(finalResult.low), numberOrBlank_(finalResult.high), numberOrBlank_(finalResult.currentIncome), numberOrBlank_(finalResult.feasibility), safeCell_(JSON.stringify(finalResult.strengths)), safeCell_(JSON.stringify(finalResult.actions)), safeCell_(JSON.stringify(finalResult.directions)),
    safeCell_(source.ref), safeCell_(source.utmSource), safeCell_(source.utmMedium), safeCell_(source.utmCampaign), safeCell_(source.pageUrl), safeCell_(source.referrer)
  ];
}

function validatePayload_(data) {
  if (!data || typeof data !== 'object') throw new Error('invalid payload');
  const name = String(data.fullName || '').trim();
  if (name.replace(/\s/g, '').length < 2 || name.length > 60) throw new Error('invalid fullName');
  if (!data.requestId || String(data.requestId).length > 100) throw new Error('invalid requestId');
  if (!data.answers || typeof data.answers !== 'object') throw new Error('answers are required');
  if (!data.answerLabels || typeof data.answerLabels !== 'object') throw new Error('answerLabels are required');
  if (!data.narratives || typeof data.narratives !== 'object') throw new Error('narratives are required');
  if (String(data.narratives.workDetails || '').trim().length < 20) throw new Error('workDetails is too short');
  if (String(data.narratives.achievementDetails || '').trim().length < 20) throw new Error('achievementDetails is too short');
  if (String(data.narratives.careerGoal || '').trim().length < 10) throw new Error('careerGoal is too short');
  if (!data.baseResult || typeof data.baseResult !== 'object') throw new Error('baseResult is required');
}

function sanitizeBaseResult_(base) {
  return {
    type: safeText_(base.type, 60),
    summary: safeText_(base.summary, 500),
    currentIncome: clampNumber_(base.currentIncome, 100, 2000),
    low: clampNumber_(base.low, 200, 1200),
    high: clampNumber_(base.high, 230, 1400),
    feasibility: clampNumber_(base.feasibility, 25, 95),
    strengths: safeArray_(base.strengths, 4),
    actions: safeArray_(base.actions, 4),
    directions: safeArray_(base.directions, 4)
  };
}

function redactPersonalInfo_(value) {
  return safeText_(value, 800)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[メールアドレス削除]')
    .replace(/(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, '[電話番号削除]')
    .replace(/https?:\/\/\S+/gi, '[URL削除]');
}

function postMessageOutput_(payload) {
  const json = JSON.stringify(payload)
    .replace(/<\//g, '<\\/')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const origin = JSON.stringify(ALLOWED_PARENT_ORIGIN);
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' +
    '<script>window.parent.postMessage(' + json + ',' + origin + ');<\/script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function safeText_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength || 1000);
}

function safeArray_(value, maxItems) {
  if (!Array.isArray(value)) return [];
  return value.map(function(item) { return safeText_(item, 220); }).filter(Boolean).slice(0, maxItems || 4);
}

function safeCell_(value) {
  const text = value == null ? '' : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function numberOrBlank_(value) {
  if (value === '' || value == null) return '';
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

function clampNumber_(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function round10_(value) {
  return Math.round(Number(value) / 10) * 10;
}
