const CONFIG = {
  // Google Apps Scriptをウェブアプリとして公開したURLを設定してください。
  endpoint: ''
};

const questions = [
  {
    id: 'fullName',
    section: 'BASIC INFORMATION',
    kicker: 'お客様情報',
    title: 'お名前をフルネームで入力してください',
    help: '入力後、「次へ」を押してください。',
    type: 'text',
    placeholder: '例：山田 太郎',
    maxLength: 60
  },
  {
    id: 'ageRange',
    section: 'BASIC INFORMATION',
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
    section: 'BASIC INFORMATION',
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
    section: 'FINANCIAL STATUS',
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
    section: 'CONSULTATION THEME',
    kicker: '相談テーマ',
    title: '今回、最も相談したいテーマは何ですか？',
    help: '最も近いものを1つ選んでください。',
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
    section: 'CONSULTATION THEME',
    kicker: '面談への期待',
    title: '今回の面談で希望することに最も近いものを教えてください',
    help: '選択すると、そのまま回答が送信されます。',
    options: [
      ['specific', '具体的な改善案まで相談したい'],
      ['organize', 'まずは現状と課題を整理したい'],
      ['compare', '他社や現在の提案と比較したい'],
      ['information', '情報収集として話を聞きたい'],
      ['unsure', 'まだ決めていない']
    ]
  }
];

let currentIndex = 0;
let answers = {};
let submitting = false;
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
  else renderChoiceQuestion(question, area);

  $('back-button').disabled = currentIndex === 0 || submitting;
  $('next-button').disabled = !isCurrentAnswerValid() || submitting;
  $('next-button').textContent = '次へ';
  $('next-button').style.display = question.options ? 'none' : 'block';
  $('back-button').style.gridColumn = question.options ? '1 / -1' : 'auto';
}

function renderChoiceQuestion(question, area) {
  const list = document.createElement('div');
  list.className = 'choice-list';

  question.options.forEach(([value, label], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `choice-button${answers[question.id] === value ? ' selected' : ''}`;
    button.innerHTML = `<span class="choice-index">${index + 1}</span><span>${escapeHtml(label)}</span>`;
    button.disabled = submitting;
    button.addEventListener('click', () => {
      if (submitting) return;
      answers[question.id] = value;
      document.querySelectorAll('.choice-button').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');

      window.setTimeout(() => {
        if (currentIndex === questions.length - 1) submitSurvey();
        else advance();
      }, 180);
    });
    list.appendChild(button);
  });

  area.appendChild(list);
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
  if (question.type === 'text') return Boolean((answers[question.id] || '').trim().length >= 2);
  return Boolean(answers[question.id]);
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

async function submitSurvey() {
  if (submitting || currentIndex !== questions.length - 1 || !isCurrentAnswerValid()) return;

  if (!CONFIG.endpoint) {
    showToast('保存先が未設定です。');
    return;
  }

  submitting = true;
  $('question-title').textContent = '回答を送信しています';
  $('question-help').textContent = 'そのままお待ちください。';
  $('answer-area').innerHTML = '';
  $('back-button').disabled = true;
  $('back-button').style.gridColumn = '1 / -1';
  $('next-button').style.display = 'none';

  const params = new URLSearchParams(window.location.search);
  const payload = {
    submittedAtClient: new Date().toISOString(),
    source: params.get('source') || params.get('utm_source') || '',
    campaign: params.get('campaign') || params.get('utm_campaign') || '',
    referenceId: params.get('ref') || '',
    pageUrl: window.location.href,
    answers: { ...answers }
  };

  try {
    await fetch(CONFIG.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    showScreen('screen-complete');
  } catch (error) {
    console.error(error);
    submitting = false;
    renderQuestion();
    showToast('送信できませんでした。通信環境をご確認ください。');
  }
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
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
