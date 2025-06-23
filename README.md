# 🤖 AI会議設定エージェント

議事録を入力するだけで、ネクストアクションを抽出し、必要な会議を自動設定するAIエージェントです。

![AI会議設定エージェント](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![Mastra](https://img.shields.io/badge/Mastra-0.10.6-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ 主な機能

### 📋 議事録分析

- **自動抽出**: 議事録からネクストアクション（次に取るべき行動）を自動抽出
- **担当者・期限の特定**: 各アクションの担当者、期限、優先度を自動識別
- **部門情報**: 関連部門を自動判定

### 🎯 会議提案

- **インテリジェントな提案**: 必要な会議を自動的に提案
- **参加者の最適化**: 議事録の参加者情報から最適な出席者を選定
- **現実的なスケジューリング**: 業務時間内での適切な日程を提案

### 💬 チャット形式のインタラクション

- **動的な対話**: AIとチャット形式でインタラクティブに会議設定
- **具体的な要求処理**:
  - 会議時間の変更
  - 参加者の追加・変更
  - 日程の調整
  - スケジュール確認

### 🔧 構造化出力

- **JSON Schema**: 構造化された出力で確実なデータ処理
- **固定値なし**: LLMが実際の議事録内容を分析して動的に応答

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15.3.4 (App Router)
- **AI/LLM**: Mastra AI framework + OpenAI GPT-4o-mini
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UI**: React 19 + React Markdown
- **開発**: Turbopack (高速開発サーバー)

## 🚀 セットアップ

### 前提条件

- Node.js 18.0以上
- npm, yarn, pnpm, または bun
- OpenAI APIキー

### インストール

1. **リポジトリのクローン**

```bash
git clone https://github.com/your-username/ai-agent-calendar.git
cd ai-agent-calendar
```

2. **依存関係のインストール**

```bash
npm install
# または
yarn install
# または
pnpm install
```

3. **環境変数の設定**
   `.env.local`ファイルを作成し、以下を設定：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **開発サーバーの起動**

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

5. **アプリケーションにアクセス**
   ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📖 使用方法

### 基本的な使用方法

1. **議事録の入力**

   - トップページの議事録入力エリアに会議の議事録を貼り付け

2. **分析方法の選択**
   - **議事録分析のみ**: 分析結果のみを表示
   - **チャットで会議設定**: AIとチャット形式で対話しながら会議設定

### チャット機能の活用

1. **初期分析**: 「チャットで会議設定」をクリックすると自動的に議事録を分析
2. **インタラクティブな対話**: 以下のような要求が可能
   - `緊急対策会議の時間を90分にしたいです`
   - `参加者に田中さんを追加してください`
   - `この会議のスケジュールを確認してください`
   - `顧客説明会を作成してください`

### 議事録の例

```
2024年2月8日 四半期レビュー会議
参加者: 高橋部長、渡辺、中村、伊藤、松本
議題: Q1進捗確認と課題対応

決定事項:
- システム障害の原因調査を渡辺と中村で実施（期限: 2/20）
- 顧客対応マニュアルの更新を伊藤が担当（期限: 2/25）
- セキュリティ監査の準備を松本が開始（期限: 3/5）
- 緊急対策会議を来週開催（参加者: 高橋部長、渡辺、中村）
- 顧客説明会の準備会議を2/22に実施予定
```

## 🏗️ プロジェクト構造

```
ai-agent-calendar/
├── mastra/                    # Mastra AI 設定
│   ├── agents/               # AIエージェント定義
│   │   └── calendarAgent.ts  # カレンダーエージェント
│   ├── tools/                # AIツール
│   │   └── meeting-tools.ts  # 会議関連ツール
│   └── index.ts              # Mastra設定
├── src/
│   └── app/
│       ├── actions.ts        # Server Actions
│       ├── page.tsx          # メインページ
│       └── layout.tsx        # レイアウト
├── public/                   # 静的ファイル
└── README.md
```

## 🔧 開発

### コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクション起動
npm run start

# リンター実行
npm run lint

# コードフォーマット
npm run format

# フォーマットチェック
npm run format:check
```

### 主要なファイル

- **`mastra/agents/calendarAgent.ts`**: メインのAIエージェント
- **`mastra/tools/meeting-tools.ts`**: 会議関連のツール定義
- **`src/app/actions.ts`**: Server Actions（バックエンドロジック）
- **`src/app/page.tsx`**: フロントエンドUI

## 🚀 デプロイ

### Vercel (推奨)

1. [Vercel](https://vercel.com)にプロジェクトをインポート
2. 環境変数`OPENAI_API_KEY`を設定
3. デプロイ

### その他のプラットフォーム

- **Netlify**: `npm run build`後に`out`フォルダをデプロイ
- **Docker**: Dockerfileを作成してコンテナ化

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- [Mastra AI](https://mastra.ai) - 強力なAIフレームワーク
- [OpenAI](https://openai.com) - GPT-4o-mini API
- [Next.js](https://nextjs.org) - React フレームワーク
- [Tailwind CSS](https://tailwindcss.com) - ユーティリティファーストCSS

## 📞 サポート

問題や質問がある場合は、[Issues](https://github.com/your-username/ai-agent-calendar/issues)を作成してください。

---

**Made with ❤️ and AI**
