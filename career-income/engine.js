'use strict';

const CONFIG = window.CAREER_DIAGNOSIS_CONFIG || {};
const $ = id => document.getElementById(id);

let questions = [];
let questionIndex = 0;
let answers = {};
let fullName = '';
let result = null;
let locked = false;
let pendingRequest = null;
let loadingTimers = [];

function getBranch(job) {
  if (SALES_JOBS.has(job)) return 'sales';
  if (LICENSED_JOBS.has(job)) return 'licensed';
  if (DIGITAL_JOBS.has(job)) return 'digital';
  return 'general';
}

function rebuildQuestions() {
  questions = [...COMMON_QUESTIONS, ...BRANCH_QUESTIONS[getBranch(answers.job)]];
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(node => node.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function normalizeName(value) {
  return String(value || '').replace(/[\u3000\s]+/g, ' ').trim();
}

function validateStart() {
  const normalized = normalizeName($('full-name').value);
  const isNameValid = normalized.replace(/\s/g, '').length >= 2;
  const valid = isNameValid && $('consent').checked;
  $('start-btn').disabled = !valid;
  $('name-error').textContent = $('full-name').value && !isNameValid ? '姓・名を含む本名を入力してください。' : '';
  return valid;
}

function startDiagnosis() {
  if (!validateStart()) return;
  fullName = normalizeName($('full-name').value);
  answers = {};
  questionIndex = 0;
  result = null;
  questions = [...COMMON_QUESTIONS];
  clearNarratives();
  showScreen('quiz-screen');
  renderQuestion();
}

function renderQuestion() {
  const current = questions[questionIndex];
  $('progress-label').textContent = `QUESTION ${questionIndex + 1}`;
  $('progress-count').textContent = `${questionIndex + 1} / ${questions.length}`;
  $('progress-fill').style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
  $('question-kicker').textContent = current.category;
  $('question-title').textContent = current.title;
  $('back-btn').disabled = questionIndex === 0;
  $('choices').innerHTML = '';

  current.options.forEach(([value, label], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `choice${answers[current.id] === value ? ' selected' : ''}`;
    button.innerHTML = `<span class="choice-index">${index + 1}</span><span>${escapeHtml(label)}</span>`;
    button.addEventListener('click', () => chooseAnswer(current, value, button));
    $('choices').appendChild(button);
  });
}

function clearBranchAnswers() {
  Object.values(BRANCH_QUESTIONS).flat().forEach(question => delete answers[question.id]);
}

function chooseAnswer(question, value, button) {
  if (locked) return;
  locked = true;
  const previous = answers[question.id];
  if (question.id === 'job' && previous && previous !== value) clearBranchAnswers();
  answers[question.id] = value;
  document.querySelectorAll('.choice').forEach(node => {
    node.disabled = true;
    node.classList.toggle('selected', node === button);
  });
  if (question.id === 'job') rebuildQuestions();

  window.setTimeout(() => {
    if (questionIndex < questions.length - 1) {
      questionIndex += 1;
      locked = false;
      renderQuestion();
      return;
    }
    locked = false;
    showScreen('narrative-screen');
    validateNarratives();
  }, 230);
}

function goBack() {
  if (locked || questionIndex === 0) return;
  questionIndex -= 1;
  renderQuestion();
}

function backToQuestions() {
  questionIndex = Math.max(0, questions.length - 1);
  showScreen('quiz-screen');
  renderQuestion();
}

function clearNarratives() {
  ['work-details', 'achievement-details', 'career-goal'].forEach(id => { $(id).value = ''; });
  updateNarrativeCounters();
  $('narrative-error').textContent = '';
}

function narrativeValues() {
  return {
    workDetails: $('work-details').value.trim(),
    achievementDetails: $('achievement-details').value.trim(),
    careerGoal: $('career-goal').value.trim()
  };
}

function validateNarratives() {
  const values = narrativeValues();
  const valid = values.workDetails.length >= 20 && values.achievementDetails.length >= 20 && values.careerGoal.length >= 10;
  $('analyze-btn').disabled = !valid;
  $('narrative-error').textContent = '';
  updateNarrativeCounters();
  return valid;
}

function updateNarrativeCounters() {
  $('work-count').textContent = `${$('work-details').value.length} / 600`;
  $('achievement-count').textContent = `${$('achievement-details').value.length} / 600`;
  $('goal-count').textContent = `${$('career-goal').value.length} / 400`;
}

function startAnalysis() {
  if (!validateNarratives()) {
    $('narrative-error').textContent = '仕事内容と成果は20文字以上、転職で実現したいことは10文字以上入力してください。';
    return;
  }

  const baseResult = calculateBaseResult();
  result = baseResult;
  showScreen('loading-screen');
  startLoadingAnimation();

  const endpoint = String(CONFIG.gasEndpoint || '').trim();
  if (!endpoint) {
    window.setTimeout(() => completeWithFallback(baseResult, '回答保存先とAI分析がまだ設定されていません。基本診断のみ表示しています。'), 2100);
    return;
  }

  submitToAppsScript(endpoint, createPayload(baseResult));
}

function startLoadingAnimation() {
  stopLoadingAnimation();
  const steps = [...document.querySelectorAll('.analysis-step')];
  steps.forEach((step, index) => step.className = `analysis-step${index === 0 ? ' active' : ''}`);
  const messages = ['現在の経験と役割を整理しています。', '具体的な成果と再現性を評価しています。', '希望するキャリアとの適合度を確認しています。', '最終的な年収レンジを算出しています。'];
  messages.forEach((message, index) => {
    const timer = window.setTimeout(() => {
      steps.forEach((step, stepIndex) => {
        step.className = `analysis-step${stepIndex < index ? ' done' : stepIndex === index ? ' active' : ''}`;
      });
      $('loading-message').textContent = message;
    }, index * 1150);
    loadingTimers.push(timer);
  });
}

function stopLoadingAnimation() {
  loadingTimers.forEach(timer => window.clearTimeout(timer));
  loadingTimers = [];
}

function submitToAppsScript(endpoint, payload) {
  cleanupPendingRequest();
  const requestId = payload.requestId;
  const frameName = `career_analysis_${requestId.replace(/[^a-zA-Z0-9_]/g, '')}`;
  const iframe = document.createElement('iframe');
  iframe.name = frameName;
  iframe.hidden = true;
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = endpoint;
  form.target = frameName;
  form.hidden = true;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = JSON.stringify(payload);
  form.appendChild(input);
  document.body.appendChild(form);

  const timeout = window.setTimeout(() => {
    if (!pendingRequest || pendingRequest.requestId !== requestId) return;
    const baseResult = payload.baseResult;
    cleanupPendingRequest();
    completeWithFallback(baseResult, 'AI分析が混雑したため、選択式回答による基本診断を表示しています。回答の保存状況は確認できませんでした。');
  }, 30000);

  pendingRequest = { requestId, iframe, form, timeout };
  form.submit();
}

function handleAppsScriptMessage(event) {
  const data = event.data;
  if (!data || data.source !== 'career-income-diagnosis' || !pendingRequest || data.requestId !== pendingRequest.requestId) return;
  if (!isGoogleScriptOrigin(event.origin)) return;
  const fallback = result;
  cleanupPendingRequest();
  stopLoadingAnimation();

  if (!data.ok || !data.result) {
    completeWithFallback(fallback, data.error ? `AI分析に失敗したため、基本診断を表示しています。${data.error}` : 'AI分析に失敗したため、基本診断を表示しています。');
    return;
  }

  result = normalizeServerResult(data.result, fallback);
  paintResult(result);
  showScreen('result-screen');
  updateSaveStatus(data);
}

function isGoogleScriptOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return host === 'script.google.com' || host === 'script.googleusercontent.com' || host.endsWith('.googleusercontent.com');
  } catch (_) {
    return false;
  }
}

function cleanupPendingRequest() {
  if (!pendingRequest) return;
  window.clearTimeout(pendingRequest.timeout);
  pendingRequest.form?.remove();
  pendingRequest.iframe?.remove();
  pendingRequest = null;
}

function completeWithFallback(baseResult, message) {
  cleanupPendingRequest();
  stopLoadingAnimation();
  result = { ...baseResult, aiUsed: false, aiModel: '', analysisSummary: baseResult.summary };
  paintResult(result);
  showScreen('result-screen');
  $('save-status').textContent = message;
  $('save-status').className = 'save-status error';
}

function normalizeServerResult(serverResult, fallback) {
  const rawLow = Number(serverResult.low);
  const rawHigh = Number(serverResult.high);
  const rawFeasibility = Number(serverResult.feasibility);
  const low = clamp(round10(Number.isFinite(rawLow) ? rawLow : fallback.low), 200, 1200);
  const high = clamp(round10(Number.isFinite(rawHigh) ? rawHigh : fallback.high), low + 30, 1400);
  const feasibility = clamp(Math.round(Number.isFinite(rawFeasibility) ? rawFeasibility : fallback.feasibility), 25, 95);
  return {
    ...fallback,
    ...serverResult,
    low,
    high,
    feasibility,
    type: String(serverResult.type || fallback.type).slice(0, 60),
    summary: String(serverResult.summary || fallback.summary).slice(0, 500),
    strengths: sanitizeStringArray(serverResult.strengths, fallback.strengths),
    actions: sanitizeStringArray(serverResult.actions, fallback.actions),
    directions: sanitizeStringArray(serverResult.directions, fallback.directions),
    aiUsed: Boolean(serverResult.aiUsed),
    aiModel: String(serverResult.aiModel || '')
  };
}

function sanitizeStringArray(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map(item => String(item || '').trim()).filter(Boolean).slice(0, 4);
  return items.length ? items : fallback;
}

function calculateBaseResult() {
  const currentIncome = Number(answers.income || 325);
  const baseAdjustments = {
    180: [50, 130], 225: [45, 120], 275: [40, 110], 325: [30, 100], 375: [20, 90], 425: [10, 80],
    475: [0, 70], 550: [-10, 60], 650: [-20, 50], 750: [-30, 40], 850: [-60, 20]
  };
  let [lowAdjustment, highAdjustment] = baseAdjustments[currentIncome] || [20, 80];
  let feasibility = 52;
  const add = (low, high, score) => { lowAdjustment += low; highAdjustment += high; feasibility += score; };

  if (['target', 'numbers'].includes(answers.achievement)) add(10, 20, 9);
  if (answers.achievement === 'repeat') add(15, 30, 13);
  if (['award', 'team'].includes(answers.achievement)) add(25, 45, 17);
  if (answers.role === 'independent') feasibility += 5;
  if (answers.role === 'training') add(5, 15, 8);
  if (answers.role === 'leader') add(10, 25, 11);
  if (['manager', 'owner'].includes(answers.role)) add(20, 40, 15);
  if (answers.experience === '2-3') feasibility += 5;
  if (answers.experience === '3-5') add(5, 15, 8);
  if (['5-10', '10+'].includes(answers.experience)) add(10, 20, 10);
  if (answers.experience === 'lt1') add(-10, -15, -7);
  if (['same', 'otherIndustry', 'management'].includes(answers.direction)) feasibility += 10;
  if (answers.direction === 'otherRole') add(-5, -10, -3);
  if (answers.direction === 'new') add(-25, -30, -10);
  if (['proposal', 'undecided'].includes(answers.direction)) feasibility -= 4;
  if (answers.area === 'tokyo') add(0, 10, 4);
  if (answers.area === 'undecided') feasibility -= 3;

  const branch = getBranch(answers.job);
  if (branch === 'sales') {
    if (['b2bNew', 'multiple'].includes(answers.salesStyle)) add(10, 25, 8);
    if (['100-299', '300+'].includes(answers.priceBand)) add(10, 25, 7);
    if (answers.salesPerformance === '100') add(5, 15, 7);
    if (answers.salesPerformance === '120+') add(15, 30, 12);
    if (['top20', 'top'].includes(answers.salesPerformance)) add(25, 45, 17);
    if (answers.salesPerformance === 'lt80') add(-15, -20, -8);
  }
  if (branch === 'licensed') {
    if (['national', 'multiple'].includes(answers.qualification)) add(5, 20, 10);
    if (answers.licensedDirection === 'same') add(5, 15, 8);
    if (answers.licensedDirection === 'new') add(-20, -25, -8);
  }
  if (branch === 'digital') {
    if (answers.skillLevel === 'independent') add(10, 25, 10);
    if (['owner', 'manager'].includes(answers.skillLevel)) add(20, 40, 15);
    if (['numbers', 'multiple', 'team'].includes(answers.measurableOutcome)) add(10, 30, 12);
    if (answers.skillLevel === 'learning') add(-20, -25, -10);
  }
  if (branch === 'general') {
    if (['improvement', 'management', 'specialized'].includes(answers.strength)) add(5, 20, 7);
    if (['team', 'numbers'].includes(answers.processImprovement)) add(10, 25, 10);
  }

  lowAdjustment = clamp(lowAdjustment, -100, 140);
  highAdjustment = clamp(highAdjustment, -60, 180);
  const low = Math.max(200, round10(currentIncome + lowAdjustment));
  const high = Math.max(low + 30, round10(currentIncome + highAdjustment));
  feasibility = clamp(Math.round(feasibility), 25, 95);
  const [type, summary] = determineType(currentIncome);

  return {
    fullName,
    currentIncome,
    low,
    high,
    feasibility,
    type,
    summary,
    strengths: baseStrengths(),
    actions: baseActions(),
    directions: baseDirections(),
    aiUsed: false,
    aiModel: ''
  };
}

function determineType(currentIncome) {
  const highAchievement = ['repeat', 'award', 'team'].includes(answers.achievement);
  const solidAchievement = ['target', 'numbers', 'repeat', 'award', 'team'].includes(answers.achievement);
  if (answers.direction === 'new' || answers.licensedDirection === 'new') return ['キャリアチェンジ成長タイプ', '転職直後の年収だけでなく、数年後の市場価値まで含めて職種を選ぶことが重要なタイプです。'];
  if (['manager', 'owner'].includes(answers.role) || answers.direction === 'management') return ['マネジメント昇格タイプ', '現場経験に加えて、教育・目標管理・組織運営の経験を評価へつなげやすいタイプです。'];
  if (highAchievement && ['same', 'otherIndustry'].includes(answers.direction)) return ['即戦力ステップアップタイプ', 'これまでの実績を活かし、業界や企業の評価制度を変えることで年収アップを狙いやすいタイプです。'];
  if (currentIncome <= 425 && solidAchievement) return ['隠れ高市場価値タイプ', '現在の実績や役割が、今の年収に十分反映されていない可能性があるタイプです。'];
  if (['proposal', 'undecided'].includes(answers.direction)) return ['キャリア情報収集タイプ', '現在の経験がどの業界や職種で評価されるかを知ることで、選択肢を整理しやすいタイプです。'];
  return ['経験活用バランスタイプ', 'これまでの経験を軸に、年収・仕事内容・成長性のバランスを見ながら転職先を選ぶタイプです。'];
}

function baseStrengths() {
  const list = [];
  if (['numbers', 'repeat', 'award', 'team'].includes(answers.achievement)) list.push('成果を数字や事実で説明できる経験がある');
  if (['training', 'leader', 'manager', 'owner'].includes(answers.role)) list.push('教育・目標管理・マネジメント経験がある');
  if (['3-5', '5-10', '10+'].includes(answers.experience)) list.push('継続した実務経験がある');
  if (['100-299', '300+'].includes(answers.priceBand)) list.push('高単価商材を扱った営業経験がある');
  if (['top20', 'top'].includes(answers.salesPerformance)) list.push('営業成績を客観的に示せる');
  if (['owner', 'manager'].includes(answers.skillLevel)) list.push('施策やプロジェクトに責任を持った経験がある');
  if (['national', 'multiple'].includes(answers.qualification)) list.push('専門資格を活かせる');
  const defaults = ['現在の業務経験を整理することで評価材料を増やせる', '希望職種を絞ることで経験との接続を明確にできる', '選考準備によって市場評価が変わる余地がある'];
  defaults.forEach(item => { if (list.length < 3) list.push(item); });
  return list.slice(0, 4);
}

function baseActions() {
  const list = [
    '担当業務ではなく、課題・行動・結果の順で職務経験を整理する',
    '売上・契約数・達成率・改善率などの数字を洗い出す',
    answers.direction === 'new' ? '未経験職種では初年度年収と3年後の成長性を分けて比較する' : '同職種または経験が近い求人から比較し、評価される条件を把握する'
  ];
  if (answers.area === 'undecided') list.push('勤務地を決め、応募できる求人の母数を明確にする');
  return list;
}

function baseDirections() {
  const branch = getBranch(answers.job);
  if (branch === 'sales') return ['法人営業・人材・SaaSなど営業経験を活かせる業界', '成果評価の基準が明確な企業', '教育・リーダー経験を活かせる営業組織'];
  if (branch === 'licensed') return ['資格を活かせる別法人・別施設', '人材・採用・カスタマーサポートなど対人経験を活かせる職種', '未経験研修が整った一般企業'];
  if (branch === 'digital') return ['実務領域と成果が一致する専門職', '施策責任やプロジェクト経験を評価する企業', 'スキルの専門性を高められる成長企業'];
  return ['現在の対人・業務経験を活かせる近接職種', '教育体制と評価基準が明確な企業', '業務改善や専門性を評価する企業'];
}

function createPayload(baseResult) {
  const labels = {};
  questions.forEach(question => {
    const selected = question.options.find(([value]) => value === answers[question.id]);
    labels[question.id] = selected ? selected[1] : '';
  });
  const query = new URLSearchParams(window.location.search);
  return {
    requestId: createRequestId(),
    responseId: createRequestId(),
    submittedAtClient: new Date().toISOString(),
    fullName,
    answers: { ...answers },
    answerLabels: labels,
    narratives: narrativeValues(),
    baseResult: {
      type: baseResult.type,
      summary: baseResult.summary,
      currentIncome: baseResult.currentIncome,
      low: baseResult.low,
      high: baseResult.high,
      feasibility: baseResult.feasibility,
      strengths: baseResult.strengths,
      actions: baseResult.actions,
      directions: baseResult.directions
    },
    source: {
      ref: query.get('ref') || '',
      utmSource: query.get('utm_source') || '',
      utmMedium: query.get('utm_medium') || '',
      utmCampaign: query.get('utm_campaign') || '',
      pageUrl: window.location.href,
      referrer: document.referrer || ''
    }
  };
}
