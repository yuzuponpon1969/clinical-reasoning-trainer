# デプロイガイド (Vercel)

このアプリケーションは **Vercel** へのデプロイに最適化されています。以下の手順に従って公開してください。

## 事前準備
1. **GitHubアカウント**: ソースコードを保存するために必要です。
2. **Vercelアカウント**: アプリケーションを公開するために必要です ([https://vercel.com/signup](https://vercel.com/signup))。
3. **OpenAI API Key**: アプリケーションの動作に必要です。

## 手順 1: GitHubへのプッシュ
まず、このプロジェクトをGitHubのリポジトリにプッシュします。

1. GitHubで新しいリポジトリを作成します（例: `clinical-reasoning-trainer`）。
2. 以下のコマンドを実行して、コードをGitHubに送信します。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/clinical-reasoning-trainer.git
git push -u origin main
```
※ `YOUR_USERNAME` はご自身のユーザー名に置き換えてください。

## 手順 2: Vercelへのデプロイ
1. [Vercelのダッシュボード](https://vercel.com/dashboard)にアクセスし、「**Add New...**」 -> 「**Project**」をクリックします。
2. 「Import Git Repository」で、先ほど作成したGitHubリポジトリの「**Import**」ボタンを押します。

## 手順 3: 環境変数の設定 (重要)
「Configure Project」画面で、**Environment Variables** を設定します。

1. **Environment Variables** セクションを展開します。
2. 以下の変数を追加します。
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (あなたのOpenAI APIキー)

## 手順 4: デプロイ実行
1. 「**Deploy**」ボタンをクリックします。
2. ビルドが開始され、1分ほどで完了します。
3. 完了画面が表示されたら、提供されたURLにアクセスして動作を確認してください。

## 補足: 動作確認
- デプロイ後のURLにアクセスし、「医療面接開始」ボタンを押してチャットが開始されるか確認してください。
- エラーが出る場合は、APIキーが正しく設定されているか確認してください（Vercelの設定画面で再設定し、Redeployする必要があります）。
