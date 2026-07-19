const CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycby9MpxQ8JsuPotFtyAod77yZnd9-6rUfLbKyKMWJpyLoPtkvKMQwbdbHBhemcvkXtiE/exec',
  submissionTimeoutMs: 12000
};

const questions = [
  {
    id: 'fullName',
    section: '基本情報',
    kicker: 'お客様情報',
    title: 'お名前をフルネームで入力してください',
    help: '入力後、「次へ」を押してください。',
    type: 'text',
    placeholder: '例：山田 太郎',
    maxLength: 60
  },
  {
    id: 'ageRange',
    section: '基本情報',
    kicker: '年齢',
    title: '年齢に最も近いものを選んでください',
    options: [
      ['18-24', '18〜24歳'],
      ['25-29', '25〜29歳'],
      ['30-34', '30〜34歳'],
      ['35-39', '35〜39歳'],
      ['40-49', '40〜49歳'],
      ['50-59', '50〜59歳'],
      ['60+', '60歳以上']
    ]
  },
  {
    id: 'employment',
    section: '基本情報',
    kicker: '働き方',
    title: '現在の働き方を教えてください',
    options: [
      ['employee', '会社員'],
      ['public', '公務員'],
      ['executive', '会社経営者・役員'],
      ['self_employed', '個人事業主・フリーランス'],
      ['part_time', 'パート・アルバイト'],
      ['homemaker', '専業主婦・主夫'],
      ['student', '学生'],
      ['other', '無職・その他']
    ]
  },
  {
    id: 'annualIncome',
    section: '現在の状況',
    kicker: '年収',
    title: '現在のご本人の年収を教えてください',
    help: '税込・概算で構いません。',
    options: [
      ['lt200', '200万円未満'],
      ['200-299', '200万〜299万円'],
      ['300-399', '300万〜399万円'],
      ['400-499', '400万〜499万円'],
      ['500-699', '500万〜699万円'],
      ['700-999', '700万〜999万円'],
      ['1000-1499', '1,000万〜1,499万円'],
      ['1500+', '1,500万円以上']
    ]
  },
  {
    id: 'primaryConcern',
    section: '相談内容',
    kicker: '気になること',
    title: '気になることをすべて選択してください',
    help: '複数選択できます。選択後に「次へ」を押してください。',
    type: 'multi',
    options: [
      ['protection', '生命保険・医療保険の見直し'],
      ['asset_building', '貯蓄・資産形成について'],
      ['retirement', '老後資金・年金について'],
      ['education', '教育費・家族の将来について'],
      ['household', '家計・固定費について'],
      ['unsure', '何から考えればよいか分からない']
    ]
  },
  {
    id: 'consultationIntent',
    section: '相談内容',
    kicker: '面談への期待',
    title: '今回の面談で希望することに最も近いものを教えてください',
    help: '最も近いものを1つ選んでください。',
    options: [
      ['specific', '具体的な改善案まで相談したい'],
      ['organize', 'まずは現状と課題を整理したい'],
      ['compare', '他社や現在の提案と比較したい'],
      ['information', '情報収集として話を聞きたい'],
      ['unsure', 'まだ決めていない']
    ]
  }
];

const RESULT_TYPES = {
  specific: {
    code: 'ACTI',
    title: '行動派プランナー',
    description: '情報を集めるだけではなく、具体的な選択肢と次の一歩まで明確にしたいタイプです。納得できる材料がそろえば、決断から行動までスピーディーに進められます。',
    traits: [
      '結論だけでなく、具体的な進め方まで知りたい',
      '選択肢を整理したうえで、次の行動を決めたい',
      '目的と優先順位が明確になると動きやすい'
    ],
    message: '面談では、実行可能な選択肢を絞り込み、いつ・何から始めるかまで具体化すると満足度が高まりやすいでしょう。'
  },
  organize: {
    code: 'PLAN',
    title: 'じっくり整理タイプ',
    description: 'すぐに答えを出すよりも、現在地を把握し、必要なことを順序立てて整理したいタイプです。状況を見える化することで、自分に合う判断軸を作れます。',
    traits: [
      'まずは現状を正しく把握してから考えたい',
      '複雑な情報を一つずつ整理すると安心できる',
      '無理のない順番とペースを大切にしている'
    ],
    message: '面談では、現状・理想・優先順位の3つを分けて整理すると、今やるべきことが明確になりやすいでしょう。'
  },
  compare: {
    code: 'WISE',
    title: '比較検討タイプ',
    description: '一つの案をそのまま受け入れるのではなく、複数の選択肢を比べて納得したいタイプです。違いと判断基準が明確になるほど、自信を持って選べます。',
    traits: [
      'メリットだけでなく注意点も把握したい',
      '複数案を同じ条件で比較して判断したい',
      '自分なりの判断基準を持つことを重視する'
    ],
    message: '面談では、費用・将来性・柔軟性など、比較したい軸を先に決めておくと、納得できる判断につながりやすいでしょう。'
  },
  information: {
    code: 'INFO',
    title: '情報収集タイプ',
    description: '今すぐ何かを決めるより、まずは幅広く知識を得て、自分に必要なテーマを見極めたいタイプです。基礎を理解するほど、将来の選択肢が広がります。',
    traits: [
      'まずは基本から分かりやすく知りたい',
      '知らないまま判断することを避けたい',
      '必要性を理解してから検討を進めたい'
    ],
    message: '面談では、専門用語を減らし、全体像から具体例へ進めてもらうことで、必要な情報を効率よく吸収できるでしょう。'
  },
  unsure: {
    code: 'FIND',
    title: '可能性発見タイプ',
    description: 'まだ相談したい内容が固まっておらず、対話を通じて自分に必要なテーマを見つけたいタイプです。質問に答える中で、意外な課題や可能性が見えてきます。',
    traits: [
      '何から手をつけるべきか迷っている',
      '自分では気づいていない選択肢も知りたい',
      '会話しながら優先順位を見つけたい'
    ],
    message: '面談では、今の不安や将来の希望を自由に話すことから始めると、優先して整理すべきテーマが見つかりやすいでしょう。'
  }
};

const CONCERN_FOCUS = {
  protection: '現在の保障内容と、毎月支払っている保険料のバランス',
  asset_building: '無理なく続けられる積立額と、自分に合う資産形成の方法',
  retirement: '将来必要になりそうな金額と、今から準備するペース',
  education: '教育費が必要になる時期と、家計に負担をかけにくい備え方',
  household: '固定費の見直しと、毎月無理なく残せる金額',
  unsure: '現在の状況から、優先して考えるべきテーマを見つけること'
};

let currentIndex = 0;
let answers = {};
let submitting = false;
let submissionResolved = false;
let submissionTimer = null;
const $ = (id) => document.getElementById(id);
const screens = document.querySelectorAll('.screen');

function showScreen(id) {
  screens.forEach((screen) => screen.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startSurvey() {
  currentIndex = 0;
  answers = {};
  submitting = false;
  submissionResolved = false;
  if (submissionTimer) window.clearTimeout(submissionTimer);
  showScreen('screen-form');
  renderQuestion();
}

function renderQuestion() {
  const question = questions[currentIndex];
  $('section-label').textContent = question.section;
  $('progress-count').textContent = `${currentIndex + 1} / ${questions.length}`;
  $('progress-fill').style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  $('question-kicker').textContent = question.kicker;
  $('question-title').textContent = question.title;
  $('question-help').textContent = question.help || '最も近いものを1つ選んでください。';

  const area = $('answer-area');
  area.innerHTML = '';

  if (question.type === 'text') renderTextQuestion(question, area);
  else if (question.type === 'multi') renderMultiChoiceQuestion(question, area);
  else renderChoiceQuestion(question, area);

  const needsNextButton = question.type === 'text' || question.type === 'multi';
  $('back-button').disabled = currentIndex === 0 || submitting;
  $('next-button').disabled = !isCurrentAnswerValid() || submitting;
  $('next-button').textContent = '次へ';
  $('next-button').style.display = needsNextButton ? 'block' : 'none';
  $('back-button').style.gridColumn = needsNextButton ? 'auto' : '1 / -1';
}

function renderChoiceQuestion(question, area) {
  const list = document.createElement('div');
  list.className = 'choice-list';

  question.options.forEach(([value, label], index) => {
    const button = createChoiceButton(index, label, answers[question.id] === value);
    button.addEventListener('click', () => {
      if (submitting) return;
      answers[question.id] = value;
      list.querySelectorAll('.choice-button').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      window.setTimeout(() => {
        if (currentIndex === questions.length - 1) submitSurvey();
        else advance();
      }, 150);
    });
    list.appendChild(button);
  });

  area.appendChild(list);
}

function renderMultiChoiceQuestion(question, area) {
  const selectedValues = Array.isArray(answers[question.id]) ? answers[question.id] : [];
  answers[question.id] = selectedValues;

  const list = document.createElement('div');
  list.className = 'choice-list';

  question.options.forEach(([value, label], index) => {
    const button = createChoiceButton(index, label, selectedValues.includes(value));
    button.setAttribute('aria-pressed', String(selectedValues.includes(value)));

    button.addEventListener('click', () => {
      if (submitting) return;
      const currentValues = answers[question.id];
      const existingIndex = currentValues.indexOf(value);

      if (existingIndex >= 0) {
        currentValues.splice(existingIndex, 1);
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      } else {
        currentValues.push(value);
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
      }

      $('next-button').disabled = !isCurrentAnswerValid();
    });

    list.appendChild(button);
  });

  area.appendChild(list);
}

function createChoiceButton(index, label, selected) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `choice-button${selected ? ' selected' : ''}`;
  button.innerHTML = `<span class="choice-index">${index + 1}</span><span>${escapeHtml(label)}</span>`;
  button.disabled = submitting;
  return button;
}

function renderTextQuestion(question, area) {
  const wrap = document.createElement('div');
  wrap.className = 'input-wrap';

  const input = document.createElement('input');
  input.className = 'text-input';
  input.type = 'text';
  input.autocomplete = 'name';
  input.placeholder = question.placeholder || '';
  input.maxLength = question.maxLength || 100;
  input.value = answers[question.id] || '';
  input.setAttribute('aria-label', question.title);

  const error = document.createElement('p');
  error.className = 'field-error';
  error.id = 'field-error';

  input.addEventListener('input', () => {
    answers[question.id] = input.value.trim();
    $('next-button').disabled = !isCurrentAnswerValid();
    error.textContent = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && isCurrentAnswerValid()) advance();
  });

  wrap.append(input, error);
  area.appendChild(wrap);
  window.setTimeout(() => input.focus(), 80);
}

function isCurrentAnswerValid() {
  const question = questions[currentIndex];
  const answer = answers[question.id];

  if (question.type === 'text') return Boolean((answer || '').trim().length >= 2);
  if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0;
  return Boolean(answer);
}

function advance() {
  if (!isCurrentAnswerValid() || submitting) {
    if (questions[currentIndex].type === 'text' && $('field-error')) {
      $('field-error').textContent = 'フルネームを入力してください。';
    }
    return;
  }

  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  }
}

function goBack() {
  if (currentIndex === 0 || submitting) return;
  currentIndex -= 1;
  renderQuestion();
}

function getOptionLabel(questionId, value) {
  const question = questions.find((item) => item.id === questionId);
  if (!question || !question.options) return value;
  const option = question.options.find(([optionValue]) => optionValue === value);
  return option ? option[1] : value;
}

function appendListItems(elementId, items) {
  const list = $(elementId);
  list.innerHTML = '';
  items.forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    list.appendChild(item);
  });
}

function renderResult() {
  const result = RESULT_TYPES[answers.consultationIntent] || RESULT_TYPES.unsure;
  $('result-code').textContent = result.code;
  $('result-title').textContent = result.title;
  $('result-description').textContent = result.description;
  $('result-message-text').textContent = result.message;
  appendListItems('result-traits', result.traits);

  const concerns = Array.isArray(answers.primaryConcern) ? answers.primaryConcern : [];
  const tagArea = $('result-tags');
  tagArea.innerHTML = '';

  concerns.forEach((value) => {
    const tag = document.createElement('span');
    tag.className = 'result-tag';
    tag.textContent = getOptionLabel('primaryConcern', value);
    tagArea.appendChild(tag);
  });

  const focusItems = concerns.map((value) => CONCERN_FOCUS[value]).filter(Boolean);
  appendListItems('result-focus', focusItems);
}

function buildPayload() {
  const params = new URLSearchParams(window.location.search);
  return {
    submittedAtClient: new Date().toISOString(),
    source: params.get('source') || params.get('utm_source') || '',
    campaign: params.get('campaign') || params.get('utm_campaign') || '',
    referenceId: params.get('ref') || '',
    answers: JSON.parse(JSON.stringify(answers))
  };
}

function submitSurvey() {
  if (submitting || currentIndex !== questions.length - 1 || !isCurrentAnswerValid()) return;

  if (!CONFIG.endpoint) {
    showToast('保存先が未設定です。');
    return;
  }

  submitting = true;
  renderResult();
  showScreen('screen-complete');
  submitThroughIframe(buildPayload());
}

function submitThroughIframe(payload) {
  submissionResolved = false;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = CONFIG.endpoint;
  form.target = 'submission-frame';
  form.style.display = 'none';

  const payloadInput = document.createElement('input');
  payloadInput.type = 'hidden';
  payloadInput.name = 'payload';
  payloadInput.value = JSON.stringify(payload);

  const originInput = document.createElement('input');
  originInput.type = 'hidden';
  originInput.name = 'origin';
  originInput.value = window.location.origin;

  form.append(payloadInput, originInput);
  document.body.appendChild(form);
  form.submit();
  form.remove();

  submissionTimer = window.setTimeout(() => {
    if (!submissionResolved) {
      showToast('回答記録を確認できませんでした。スクショを保存してスタッフへお見せください。');
    }
  }, CONFIG.submissionTimeoutMs);
}

function handleSubmissionMessage(event) {
  const trustedOrigins = [
    'https://script.google.com',
    'https://script.googleusercontent.com'
  ];

  if (!trustedOrigins.includes(event.origin)) return;
  if (!event.data || event.data.type !== 'insurance-survey-response') return;

  submissionResolved = true;
  if (submissionTimer) window.clearTimeout(submissionTimer);

  if (!event.data.ok) {
    console.error('Survey submission failed:', event.data.error || 'Unknown error');
    showToast('回答の保存に失敗しました。スクショを保存してスタッフへお見せください。');
  }
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 4200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

$('start-button').addEventListener('click', startSurvey);
$('back-button').addEventListener('click', goBack);
$('next-button').addEventListener('click', advance);
window.addEventListener('message', handleSubmissionMessage);
