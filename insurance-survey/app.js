const CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycby9MpxQ8JsuPotFtyAod77yZnd9-6rUfLbKyKMWJpyLoPtkvKMQwbdbHBhemcvkXtiE/exec'
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

  if (question.type === 'text') {
    renderTextQuestion(question, area);
  } else if (question.type === 'multi') {
    renderMultiChoiceQuestion(question, area);
  } else {
    renderChoiceQuestion(question, area);
  }

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

  if (question.type === 'text') {
    return Boolean((answer || '').trim().length >= 2);
  }

  if (question.type === 'multi') {
    return Array.isArray(answer) && answer.length > 0;
  }

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

function prepareAnswersForSubmission() {
  const submittedAnswers = { ...answers };
  const concernQuestion = questions.find((question) => question.id === 'primaryConcern');

  if (Array.isArray(submittedAnswers.primaryConcern)) {
    submittedAnswers.primaryConcern = submittedAnswers.primaryConcern
      .map((value) => {
        const option = concernQuestion.options.find(([optionValue]) => optionValue === value);
        return option ? option[1] : value;
      })
      .join('、');
  }

  return submittedAnswers;
}

function submitSurvey() {
  if (submitting || currentIndex !== questions.length - 1 || !isCurrentAnswerValid()) return;

  if (!CONFIG.endpoint) {
    showToast('保存先が未設定です。');
    return;
  }

  submitting = true;

  const params = new URLSearchParams(window.location.search);
  const payload = {
    submittedAtClient: new Date().toISOString(),
    source: params.get('source') || params.get('utm_source') || '',
    campaign: params.get('campaign') || params.get('utm_campaign') || '',
    referenceId: params.get('ref') || '',
    pageUrl: window.location.href,
    answers: prepareAnswersForSubmission()
  };

  showScreen('screen-complete');

  fetch(CONFIG.endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch((error) => {
    console.error('Survey submission failed:', error);
  });
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
