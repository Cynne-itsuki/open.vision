# 転職年収診断：Googleスプレッドシート保存設定

## 1. スプレッドシートを作成

Googleスプレッドシートを新規作成します。URL内の次の部分がスプレッドシートIDです。

```text
https://docs.google.com/spreadsheets/d/【ここがID】/edit
```

## 2. Apps Scriptを作成

スプレッドシートで「拡張機能」→「Apps Script」を開き、`gas/Code.gs` の内容を貼り付けます。

先頭の以下を変更します。

```javascript
const SPREADSHEET_ID = 'ここにスプレッドシートIDを入力';
```

## 3. ウェブアプリとして公開

Apps Script右上の「デプロイ」→「新しいデプロイ」を開きます。

- 種類：ウェブアプリ
- 次のユーザーとして実行：自分
- アクセスできるユーザー：全員

デプロイ後に発行される、末尾が `/exec` のURLをコピーします。

## 4. 診断ページにURLを設定

`config.js` の `gasEndpoint` にURLを設定します。

```javascript
window.CAREER_DIAGNOSIS_CONFIG = {
  gasEndpoint: 'https://script.google.com/macros/s/...../exec'
};
```

## 5. 動作確認

診断を1件最後まで回答し、スプレッドシートの「診断回答」シートに行が追加されることを確認してください。

氏名を取得するため、公開前に利用目的・管理方法・問い合わせ先を含むプライバシー表示を確認してください。
