# 転職年収診断：スプレッドシート＋Gemini API設定

この診断は次の構成です。

- 公開画面：GitHub Pages
- AI分析・保存：Google Apps Script
- 自由記述の分析：Gemini 2.5 Flash-Lite
- 保存先：Googleスプレッドシート

本名はスプレッドシートに保存しますが、Geminiへ送信するプロンプトには含めません。自由記述内のメールアドレス・電話番号・URLも送信前に置換します。

## 1. Googleスプレッドシートを作成

Googleスプレッドシートを新規作成します。URL内の次の部分がスプレッドシートIDです。

```text
https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
```

## 2. Gemini APIキーを作成

Google AI StudioでAPIキーを作成します。

- Google AI Studioを開く
- API keysからキーを作成
- キーはGitHubやHTMLへ記載しない

## 3. Apps Scriptを作成

スプレッドシートで「拡張機能」→「Apps Script」を開き、既存のコードを削除して `gas/Code.gs` の内容を貼り付けます。

コード先頭のスプレッドシートIDを変更します。

```javascript
const SPREADSHEET_ID = 'ここにスプレッドシートIDを入力';
```

GitHub Pagesのドメインを変更する場合は、次も変更します。

```javascript
const ALLOWED_PARENT_ORIGIN = 'https://cynne-itsuki.github.io';
```

## 4. APIキーをスクリプトプロパティへ保存

Apps Script左側の「プロジェクトの設定」を開き、「スクリプト プロパティ」に次を追加します。

| プロパティ | 値 |
|---|---|
| GEMINI_API_KEY | Google AI Studioで発行したAPIキー |

APIキーを `Code.gs` に直接書かないでください。

## 5. ウェブアプリとして公開

Apps Script右上の「デプロイ」→「新しいデプロイ」を開きます。

- 種類：ウェブアプリ
- 次のユーザーとして実行：自分
- アクセスできるユーザー：全員

初回デプロイ時に、スプレッドシートと外部APIへのアクセス許可を承認します。

デプロイ後に発行される、末尾が `/exec` のURLをコピーします。

## 6. 診断ページへURLを設定

`config.js` の `gasEndpoint` に `/exec` URLを設定します。

```javascript
window.CAREER_DIAGNOSIS_CONFIG = {
  gasEndpoint: 'https://script.google.com/macros/s/...../exec'
};
```

## 7. 動作確認

1. 診断ページを開く
2. 本名を入力して同意する
3. 選択式質問と自由記述3問へ回答する
4. 結果画面に「自由記述をAI分析済み」と表示されることを確認する
5. スプレッドシートの「診断回答」シートへ1行追加されることを確認する
6. AI分析利用列が `TRUE` になっていることを確認する

AIキー未設定・無料枠超過・一時障害の場合も、選択式回答による基本診断を表示し、回答はスプレッドシートへ保存します。AIの429・5xxエラーは最大3回まで自動再試行します。

## 運用上の注意

- Apps Scriptの新しいバージョンへ変更した場合は「デプロイを管理」からウェブアプリを更新してください。
- 30件/日程度を想定し、Gemini APIは1回答につき1回だけ呼び出します。
- スプレッドシート書き込み時のみ `LockService` を使用するため、AI分析中に他の回答を不要にブロックしません。
- 公開前に、個人情報の利用目的、保存期間、管理責任者、削除依頼の窓口を別途明示してください。
