const CONFIG = {
  // Google Apps Scriptをウェブアプリとして公開したURLを設定してください。
  endpoint: '',
  operatorName: '【運営会社名を設定】',
  recipientDescription: '面談を担当する提携FP・保険代理店',
  privacyContact: '【個人情報に関する問い合わせ先を設定】'
};

const questions = [
  {
    id: 'fullName', section: 'BASIC INFORMATION', kicker: 'お客様情報',
    title: 'お名前をフルネームで入力してください', help: '面談時のご本人確認に使用します。',
    type: 'text', placeholder: '例：山田 太郎', required: true, maxLength: 60
  },
  {
    id: 'ageRange', section: 'BASIC INFORMATION', kicker: '年齢',
    title: '年齢に最も近いものを選んでください',
    options: [
      ['18-24', '18〜24歳'], ['25-29', '25〜29歳'], ['30-34', '30〜34歳'],
      ['35-39', '35〜39歳'], ['40-49', '40〜49歳'], ['50-59', '50〜59歳'], ['60+', '60歳以上']
    ]
  },
  {
    id: 'employment', section: 'BASIC INFORMATION', kicker: '働き方',
    title: '現在の働き方を教えてください',
    options: [
      ['employee', '会社員'], ['public', '公務員'], ['executive', '会社経営者・役員'],
      ['self_employed', '個人事業主・フリーランス'], ['part_time', 'パート・アルバイト'],
      ['homemaker', '専業主婦・主夫'], ['student', '学生'], ['other', '無職・その他']
    ]
  },
  {
    id: 'familyStatus', section: 'LIFE PLAN', kicker: '家族構成',
    title: '現在の家族構成に最も近いものを教えてください',
    options: [
      ['single', '独身'], ['married_no_children', '既婚・子どもなし'],
      ['married_children', '既婚・子どもあり'], ['single_parent', 'ひとり親'], ['other', 'その他']
    ]
  },
  {
    id: 'annualIncome', section: 'FINANCIAL STATUS', kicker: '年収',
    title: '現在のご本人の年収を教えてください', help: '税込・概算で構いません。',
    options: [
      ['lt200', '200万円未満'], ['200-299', '200万〜299万円'], ['300-399', '300万〜399万円'],
      ['400-499', '400万〜499万円'], ['500-699', '500万〜699万円'], ['700-999', '700万〜999万円'],
      ['1000-1499', '1,000万〜1,499万円'], ['1500+', '1,500万円以上'], ['no_answer', '回答しない']
    ]
  },
  {
    id: 'financialAssets', section: 'FINANCIAL STATUS', kicker: '金融資産',
    title: '現在の金融資産の合計に最も近いものを教えてください',
    help: '預貯金・株式・投資信託・保険の解約返戻金などの概算です。不動産は含めません。',
    options: [
      ['lt100', '100万円未満'], ['100-299', '100万〜299万円'], ['300-499', '300万〜499万円'],
      ['500-999', '500万〜999万円'], ['1000-2999', '1,000万〜2,999万円'], ['3000+', '3,000万円以上'],
      ['unknown', '把握していない'], ['no_answer', '回答しない']
    ]
  },
  {
    id: 'lumpSumCapacity', section: 'FINANCIAL STATUS', kicker: 'まとまった資金',
    title: '当面の生活資金を除き、運用先を検討できる資金はありますか？',
    help: '現時点で具体的に運用する予定がなくても構いません。',
    options: [
      ['none', '現在はない'], ['lt100', '100万円未満'], ['100-299', '100万〜299万円'],
      ['300-499', '300万〜499万円'], ['500-999', '500万〜999万円'], ['1000+', '1,000万円以上'],
      ['unknown', 'まだ分からない'], ['no_answer', '回答しない']
    ]
  },
  {
    id: 'monthlyCapacity', section: 'FINANCIAL STATUS', kicker: '毎月の余力',
    title: '毎月、貯蓄や資産形成に回せる金額はどのくらいですか？',
    help: '現在の積立額ではなく、無理なく継続できる概算でお答えください。',
    options: [
      ['0', 'ほとんどない'], ['1-2', '1万〜2万円'], ['3-4', '3万〜4万円'],
      ['5-9', '5万〜9万円'], ['10-19', '10万〜19万円'], ['20+', '20万円以上'],
      ['unknown', 'まだ分からない'], ['no_answer', '回答しない']
    ]
  },
  {
    id: 'debtStatus', section: 'FINANCIAL STATUS', kicker: '借入状況',
    title: '現在の借入状況に最も近いものを教えてください',
    options: [
      ['none', '借入はない'], ['mortgage', '住宅ローンがある'],
      ['auto_installment', '自動車ローン・ショッピング分割がある'],
      ['card_revolving', 'カードローン・リボ払いがある'], ['multiple', '複数の借入がある'],
      ['no_answer', '回答しない']
    ]
  },
  {
    id: 'insuranceStatus', section: 'PROTECTION', kicker: '現在の保障',
    title: '現在加入している生命保険・医療保険について教えてください',
    options: [
      ['none', '加入していない'], ['understand', '加入しており、内容も把握している'],
      ['unclear', '加入しているが、内容はよく分からない'], ['reviewing', '現在見直しを検討している'],
      ['no_answer', '回答しない']
    ]
  },
  {
    id: 'monthlyPremium', section: 'PROTECTION', kicker: '保険料',
    title: '毎月支払っている保険料の合計に最も近いものを教えてください',
    help: 'ご本人分のみ・概算で構いません。',
    options: [
      ['0', '0円'], ['lt1', '1万円未満'], ['1-2', '1万〜2万円未満'], ['2-3', '2万〜3万円未満'],
      ['3-5', '3万〜5万円未満'], ['5+', '5万円以上'], ['unknown', '分からない'], ['no_answer', '回答しない']
    ]
  },
  {
    id: 'investmentExperience', section: 'ASSET BUILDING', kicker: '資産形成経験',
    title: '現在の資産形成・運用状況に最も近いものを教えてください',
    options: [
      ['none', '特に行っていない'], ['cash', '預貯金を中心にしている'],
      ['nisa_fund', 'NISA・投資信託を利用している'], ['stock_etf', '株式・ETFなどを運用している'],
      ['insurance', '貯蓄性・運用型の保険を利用している'], ['realestate_other', '不動産・その他の運用をしている']
    ]
  },
  {
    id: 'primaryConcern', section: 'CONSULTATION THEME', kicker: '相談テーマ',
    title: '今回、最も相談したいテーマは何ですか？', help: '最も優先度が高いものを1つ選んでください。',
    options: [
      ['protection', '生命保険・医療保険の見直し'], ['asset_building', '毎月の資産形成・積立'],
      ['retirement', '老後資金・年金対策'], ['education', '教育費・家族の将来設計'],
      ['lump_sum', 'まとまった資金の置き場所・運用'], ['inheritance_realestate', '相続・不動産・資産承継'],
      ['household', '家計・固定費・借入の整理'], ['unsure', '何から考えればよいか分からない']
    ]
  },
  {
    id: 'consultationIntent', section: 'CONSULTATION THEME', kicker: '面談への期待',
    title: '今回の面談で希望することに最も近いものを教えてください',
    options: [
      ['specific', '具体的な改善案まで相談したい'], ['organize', 'まずは現状と課題を整理したい'],
      ['compare', '他社や現在の提案と比較したい'], ['information', '情報収集として話を聞きたい'],
      ['unsure', 'まだ決めていない']
    ]
  },
  {
    id: 'timing', section: 'CONSULTATION THEME', kicker: '検討時期',
    title: '見直しや資産形成を始める時期について、最も近いものを教えてください',
    options: [
      ['asap', '条件が合えば早めに進めたい'], ['1m', '1か月以内'], ['3m', '3か月以内'],
      ['6m', '半年以内'], ['information', '時期は未定・まずは情報収集']
    ]
  },
  {
    id: 'consent', section: 'PRIVACY', kicker: '個人情報の取扱い',
    title: '内容を確認し、送信してください', help: '同意後に回答が保存されます。', type: 'consent'
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
  else if (question.type === 'consent') renderConsentQuestion(area);
  else renderChoiceQuestion(question, area);

  $('back-button').disabled = currentIndex === 0 || submitting;
  $('next-button').disabled = !isCurrentAnswerValid() || submitting;
  $('next-button').textContent = question.type === 'consent' ? (submitting ? '送信中…' : '回答を送信') : '次へ';
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
    button.addEventListener('click', () => {
      answers[question.id] = value;
      document.querySelectorAll('.choice-button').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      window.setTimeout(() => advance(), 180);
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

function renderConsentQuestion(area) {
  const box = document.createElement('div');
  box.className = 'consent-box';
  box.innerHTML = `
    <p class="consent-summary">
      回答内容は、面談準備、相談テーマに合う担当者の選定、面談実施および連絡のために利用します。
      必要な範囲で、面談を担当する提携FP・保険代理店へ提供する場合があります。
    </p>
    <label class="checkbox-row">
      <input id="consent-checkbox" type="checkbox" ${answers.consent ? 'checked' : ''}>
      <span><button id="inline-privacy" class="inline-link" type="button">個人情報の取扱い</button>を確認し、同意します。</span>
    </label>`;
  area.appendChild(box);
  $('consent-checkbox').addEventListener('change', (event) => {
    answers.consent = event.target.checked;
    $('next-button').disabled = !isCurrentAnswerValid();
  });
  $('inline-privacy').addEventListener('click', openPrivacy);
}

function isCurrentAnswerValid() {
  const question = questions[currentIndex];
  if (question.type === 'text') return Boolean((answers[question.id] || '').trim().length >= 2);
  if (question.type === 'consent') return answers.consent === true;
  return Boolean(answers[question.id]);
}

function advance() {
  if (!isCurrentAnswerValid() || submitting) {
    if (questions[currentIndex].type === 'text' && $('field-error')) $('field-error').textContent = 'フルネームを入力してください。';
    return;
  }
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else submitSurvey();
}

function goBack() {
  if (currentIndex === 0 || submitting) return;
  currentIndex -= 1;
  renderQuestion();
}

function buildRouting() {
  const tags = [];
  if (['300-499', '500-999', '1000+'].includes(answers.lumpSumCapacity) || answers.primaryConcern === 'lump_sum') tags.push('lump_sum');
  if (answers.primaryConcern === 'inheritance_realestate') tags.push('inheritance_realestate');
  if (['protection', 'education'].includes(answers.primaryConcern) || ['married_children', 'single_parent'].includes(answers.familyStatus)) tags.push('family_protection');
  if (['asset_building', 'retirement'].includes(answers.primaryConcern) || ['3-4', '5-9', '10-19', '20+'].includes(answers.monthlyCapacity)) tags.push('asset_building');
  if (answers.primaryConcern === 'household' || ['card_revolving', 'multiple'].includes(answers.debtStatus)) tags.push('household_review');
  if (answers.insuranceStatus === 'unclear' || answers.insuranceStatus === 'reviewing') tags.push('insurance_review');
  if (tags.length === 0) tags.push('general');

  let readiness = 0;
  if (['specific', 'organize', 'compare'].includes(answers.consultationIntent)) readiness += 2;
  if (['asap', '1m', '3m'].includes(answers.timing)) readiness += 2;
  if (answers.primaryConcern !== 'unsure') readiness += 1;
  return { routeTags: [...new Set(tags)], readiness: readiness >= 4 ? 'high' : readiness >= 2 ? 'medium' : 'low' };
}

async function submitSurvey() {
  if (!isCurrentAnswerValid() || submitting) return;
  if (!CONFIG.endpoint || CONFIG.endpoint.includes('YOUR_')) {
    showToast('保存先が未設定です。運営者へご連絡ください。');
    return;
  }

  submitting = true;
  renderQuestion();
  const params = new URLSearchParams(window.location.search);
  const payload = {
    submittedAtClient: new Date().toISOString(),
    source: params.get('source') || params.get('utm_source') || '',
    campaign: params.get('campaign') || params.get('utm_campaign') || '',
    referenceId: params.get('ref') || '',
    pageUrl: window.location.href,
    answers: { ...answers },
    routing: buildRouting()
  };

  try {
    await fetch(CONFIG.endpoint, {
      method: 'POST', mode: 'no-cors',
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

function privacyHtml() {
  return `
    <p><strong>事業者：</strong>${escapeHtml(CONFIG.operatorName)}</p>
    <h3>1. 取得する情報</h3>
    <p>氏名、年齢層、就業状況、家族構成、年収帯、金融資産帯、借入状況、保険加入状況、資産形成状況、相談意向その他アンケート回答内容を取得します。</p>
    <h3>2. 利用目的</h3>
    <ul><li>面談準備および本人確認</li><li>相談内容に適した担当者の選定</li><li>面談、連絡、相談対応およびサービス改善</li><li>個人を特定しない統計データの作成</li></ul>
    <h3>3. 提供について</h3>
    <p>面談実施に必要な範囲で、${escapeHtml(CONFIG.recipientDescription)}へ回答内容を提供する場合があります。実際の提供先名称は、面談案内時または別途の方法で明示してください。</p>
    <h3>4. 保管・安全管理</h3>
    <p>回答はアクセス権限を限定した保存先で管理し、目的達成に必要な期間を超えて保持しない運用とします。</p>
    <h3>5. 任意性</h3>
    <p>回答は任意ですが、必須項目に回答いただけない場合は、面談の準備または担当者選定ができないことがあります。</p>
    <h3>6. 開示・訂正・削除等</h3>
    <p>個人情報の開示、訂正、利用停止、削除等に関するお問い合わせ先：${escapeHtml(CONFIG.privacyContact)}</p>
    <p class="small-note">公開前に、事業者名、実際の提供先、保管期間、問い合わせ窓口を確定し、専門家または保険代理店のコンプライアンス担当による確認を行ってください。</p>`;
}

function openPrivacy() {
  $('privacy-content').innerHTML = privacyHtml();
  $('privacy-dialog').showModal();
}
function closePrivacy() { $('privacy-dialog').close(); }
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

$('start-button').addEventListener('click', startSurvey);
$('back-button').addEventListener('click', goBack);
$('next-button').addEventListener('click', advance);
$('privacy-button').addEventListener('click', openPrivacy);
$('privacy-close').addEventListener('click', closePrivacy);
$('privacy-dialog').addEventListener('click', (event) => {
  if (event.target === $('privacy-dialog')) closePrivacy();
});
