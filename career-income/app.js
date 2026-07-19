'use strict';

function paintResult(value) {
  $('result-type').textContent = value.type;
  $('result-summary').textContent = `${fullName}さんは、${value.summary}`;
  $('analysis-badge').textContent = value.aiUsed ? `自由記述をAI分析済み${value.aiModel ? `・${value.aiModel}` : ''}` : '選択式回答による基本診断';
  $('salary-range').textContent = `${value.low}万〜${value.high}万円`;

  const lowDiff = value.low - value.currentIncome;
  const highDiff = value.high - value.currentIncome;
  const diff = $('salary-diff');
  diff.className = 'salary-diff';
  if (highDiff <= 0) {
    diff.textContent = '年収維持を前提に、仕事内容や働き方の改善を検討する水準です。';
    diff.classList.add('down');
  } else if (lowDiff <= 0) {
    diff.textContent = `現在年収の維持〜年間${signed(highDiff)}万円アップの可能性`;
    diff.classList.add('neutral');
  } else {
    diff.textContent = `現在より年間${signed(lowDiff)}万〜${signed(highDiff)}万円アップの可能性`;
  }

  $('feasibility-label').textContent = `${value.feasibility}%`;
  $('feasibility-fill').style.width = '0';
  window.setTimeout(() => { $('feasibility-fill').style.width = `${value.feasibility}%`; }, 70);
  $('feasibility-note').textContent = value.feasibility >= 75
    ? '経験と希望条件の整合性が比較的高く、求人を選びやすい状態です。'
    : value.feasibility >= 55
      ? '転職可能性はあります。実績整理と求人選定によって結果が変わります。'
      : '希望職種や条件を調整すると、転職実現度を高められます。';

  renderList('strength-list', value.strengths);
  renderList('action-list', value.actions);
  renderList('direction-list', value.directions);
}

function updateSaveStatus(response) {
  const status = $('save-status');
  if (response.saved) {
    status.textContent = response.result.aiUsed
      ? '氏名・回答内容・AI分析結果をスプレッドシートへ保存しました。'
      : '氏名と回答内容を保存しました。AI分析は利用できなかったため、基本診断を表示しています。';
    status.className = 'save-status success';
  } else {
    status.textContent = '診断結果は表示できましたが、スプレッドシートへの保存に失敗しました。';
    status.className = 'save-status error';
  }
}

async function copyResult() {
  if (!result) return;
  const text = `【${fullName}さんの転職年収診断】\n診断タイプ：${result.type}\n推定転職年収：${result.low}万〜${result.high}万円\n転職実現度：${result.feasibility}%\n※回答内容をもとにした簡易推定です。`;
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  $('toast').classList.add('show');
  window.setTimeout(() => $('toast').classList.remove('show'), 1700);
}

function restartDiagnosis() {
  cleanupPendingRequest();
  stopLoadingAnimation();
  questions = [];
  questionIndex = 0;
  answers = {};
  fullName = '';
  result = null;
  locked = false;
  $('full-name').value = '';
  $('consent').checked = false;
  $('start-btn').disabled = true;
  $('name-error').textContent = '';
  $('save-status').textContent = '回答内容を保存しています。';
  $('save-status').className = 'save-status';
  clearNarratives();
  showScreen('start-screen');
}

function createRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function renderList(id, items) {
  $(id).innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function round10(value) { return Math.round(value / 10) * 10; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value))); }
function signed(value) { return value > 0 ? `＋${value}` : value < 0 ? `−${Math.abs(value)}` : '±0'; }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

window.addEventListener('message', handleAppsScriptMessage);
document.addEventListener('DOMContentLoaded', () => {
  $('full-name').addEventListener('input', validateStart);
  $('consent').addEventListener('change', validateStart);
  $('start-btn').addEventListener('click', startDiagnosis);
  $('back-btn').addEventListener('click', goBack);
  $('narrative-back').addEventListener('click', backToQuestions);
  $('analyze-btn').addEventListener('click', startAnalysis);
  $('copy-btn').addEventListener('click', copyResult);
  $('restart-btn').addEventListener('click', restartDiagnosis);
  ['work-details', 'achievement-details', 'career-goal'].forEach(id => $(id).addEventListener('input', validateNarratives));
  $('full-name').addEventListener('keydown', event => {
    if (event.key === 'Enter' && validateStart()) startDiagnosis();
  });
});
