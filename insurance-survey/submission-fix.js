// Apps Scriptの旧版・新版の両方で受信できるJSON POSTを使用します。
// app.js内のsubmitThroughIframeを、このファイルで上書きします。
function submitThroughIframe(payload) {
  submissionResolved = false;

  const compatiblePayload = {
    ...payload,
    submissionId: createSubmissionId()
  };

  fetch(CONFIG.endpoint, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-store',
    keepalive: true,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(compatiblePayload)
  })
    .then(() => {
      submissionResolved = true;
      if (submissionTimer) window.clearTimeout(submissionTimer);
      console.info('Survey response sent to Apps Script.');
    })
    .catch((error) => {
      console.error('Survey submission failed:', error);
      showToast('回答を送信できませんでした。通信環境を確認して、もう一度お試しください。');
    });
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2)
  ].join('-');
}
