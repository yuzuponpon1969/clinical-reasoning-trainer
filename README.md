# 医療面接トレーナー (Clinical Reasoning Trainer)

AI模擬患者との対話を通じて、柔道整復師向けの医療面接・臨床推論スキルをトレーニングするWebアプリケーションです。

## 特徴
- **AI模擬患者**: 膝の痛みを訴える患者役をAIが演じます。
- **リアルタイム対話**: チャット形式で問診、身体診察（シミュレーション）を行えます。
- **臨床推論サポート**: 鑑別判断の入力や、AIによるアドバイス機能があります。
- **自動評価**: mini-CEXに基づいたフィードバックを自動生成します。
- **ログ保存**: トレーニング記録をテキストファイルとしてダウンロードできます。

## 技術スタック
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI API (GPT-4o-mini)

## ローカルでの実行方法

1. リポジトリをクローンします。
2. 依存関係をインストールします。
   ```bash
   npm install
   ```
3. `.env.local` ファイルを作成し、OpenAI APIキーを設定します。
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```
4. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```
5. `http://localhost:3000` にアクセスします。

## デプロイ
Vercelへのデプロイ手順については [DEPLOY.md](./DEPLOY.md) を参照してください。
