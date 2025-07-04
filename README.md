# 🤖 AI会議設定エージェント

議事録を入力するだけで、ネクストアクションを抽出し、必要な会議を自動設定するAIエージェントです。

![AI会議設定エージェント](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![Mastra](https://img.shields.io/badge/Mastra-0.10.6-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚧 開発状況・TODO

### ✅ 実装済み機能

- **議事録分析**: LLM（GPT-4o-mini）による高品質な議事録解析
- **スケジュール統合**: 参加者の実際のスケジュールを考慮した会議時刻提案
- **チャット機能**: AIとの対話による動的な会議設定
- **モックシステム**: Outlookなしでも完全動作するモック機能（8名のダミーユーザー）
- **UI/UX**: レスポンシブデザイン、スクロール最適化済み
- **エラーハンドリング**: 堅牢なエラー処理とフォールバック機能

### 🎯 優先度: 高（次のスプリント）

#### 1. **実際のOutlook連携**

- **概要**: Microsoft Graph APIとの実際の連携
- **詳細**:
  - OAuth2認証フローの完成 (`src/app/auth/microsoft/route.ts`)
  - 実際のカレンダーデータ取得
  - モックからリアルAPIへの切り替え機能
- **ファイル**: `src/app/outlook-actions.ts`, `src/lib/microsoft-graph.ts`
- **推定工数**: 3-5日

#### 2. **会議作成機能の実装**

- **概要**: 提案された会議を実際にOutlookカレンダーに作成
- **詳細**:
  - Microsoft Graph APIでの会議作成
  - 参加者への招待送信
  - 会議室予約機能（オプション）
- **ファイル**: `src/app/actions.ts` (createMeeting関数)
- **推定工数**: 2-3日

#### 3. **ユーザー認証・権限管理**

- **概要**: セキュアなユーザー認証システム
- **詳細**:
  - NextAuth.jsの実装
  - ユーザーセッション管理
  - カレンダーアクセス権限の確認
- **新規ファイル**: `src/app/api/auth/[...nextauth]/route.ts`
- **推定工数**: 2-3日

### 🔧 優先度: 中（次々スプリント）

#### 4. **設定・カスタマイズ機能**

- **概要**: ユーザー個別設定とカスタマイズ
- **詳細**:
  - 業務時間設定（現在9:00-18:00固定）
  - 会議時間デフォルト設定
  - 通知設定
  - 言語設定（現在日本語のみ）
- **新規ファイル**: `src/app/settings/page.tsx`
- **推定工数**: 3-4日

#### 5. **履歴・ダッシュボード機能**

- **概要**: 過去の分析結果と会議履歴の管理
- **詳細**:
  - 議事録分析履歴の保存
  - 作成した会議の追跡
    <!-- - 統計ダッシュボード -->
    <!-- - エクスポート機能 -->
- **新規ファイル**: `src/app/history/`, `src/app/dashboard/`
- **推定工数**: 4-5日

#### 6. **高度なスケジューリング**

- **概要**: より柔軟なスケジューリング機能
- **詳細**:
  - 複数日程候補の提示
  - 会議室の空き状況確認
  - タイムゾーン対応
  - 繰り返し会議の設定
- **ファイル**: `src/app/outlook-actions.ts` (suggestMeetingTimes拡張)
- **推定工数**: 3-4日

### 🐛 既知の技術的課題

1. **パフォーマンス**: 大量の会議データでの処理速度最適化が必要
2. **エラーハンドリング**: Microsoft Graph APIのレート制限対応
3. **テスト**: ユニットテスト・統合テストの整備
4. **セキュリティ**: APIキーの適切な管理、XSS/CSRF対策

### 📋 開発ガイドライン

- **コード品質**: TypeScript strict mode, ESLint, Prettier使用
- **ブランチ**: `feature/機能名`, `fix/修正内容` 形式
- **レビュー**: すべてのPRは最低1名のレビュー必須
- **テスト**: 新機能追加時はテストも同時実装

### 🔗 関連リンク

- [Microsoft Graph API ドキュメント](https://docs.microsoft.com/en-us/graph/)
- [Mastra AI ドキュメント](https://mastra.ai/docs)
- [Next.js App Router ガイド](https://nextjs.org/docs/app)

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

# Microsoft Graph API (Outlook Calendar Integration)
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Microsoft Tenant ID (for single-tenant applications)
MICROSOFT_TENANT_ID=your_tenant_id_here
```

### Microsoft Graph API の設定

Outlookカレンダー統合を有効にするには、Azure Active Directoryでアプリケーションを登録する必要があります：

1. **Azure ポータルにアクセス**

   - [Azure Portal](https://portal.azure.com)にログイン
   - 「Azure Active Directory」→「アプリの登録」→「新規登録」

2. **アプリケーションの登録**

   - 名前: `AI会議設定エージェント`
   - サポートされるアカウントの種類: `この組織ディレクトリのみのアカウント`
   - リダイレクトURI: `http://localhost:3000/auth/microsoft`

3. **API アクセス許可の設定**
   以下のMicrosoft Graph権限を追加：

   - `User.Read` (委任)
   - `Calendars.Read` (委任)
   - `Calendars.Read.Shared` (委任)
   - `User.Read.All` (委任)

4. **クライアントシークレットの作成**

   - 「証明書とシークレット」→「新しいクライアントシークレット」
   - 説明: `AI Calendar Agent Secret`
   - 有効期限: `24か月`

5. **環境変数の設定**

   - `MICROSOFT_CLIENT_ID`: アプリケーション（クライアント）ID
   - `MICROSOFT_CLIENT_SECRET`: 作成したクライアントシークレットの値

6. **開発サーバーの起動**

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

### AWS Amplify

AWS Amplifyを使用してデプロイする方法：

#### 1. GitHubリポジトリからのデプロイ

1. **AWS Amplifyコンソールにアクセス**

   - [AWS Amplify Console](https://console.aws.amazon.com/amplify/)にログイン

2. **新しいアプリの作成**

   - 「New app」→「Host web app」をクリック
   - GitHubを選択してリポジトリを接続

3. **ビルド設定の構成**
   - Amplifyが自動的にNext.jsを検出
   - カスタムビルド設定が必要な場合は`amplify.yml`を作成：

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

4. **環境変数の設定**

   - App settings → Environment variables
   - `OPENAI_API_KEY`を追加

5. **デプロイの実行**
   - 「Save and deploy」をクリック

#### 2. Amplify CLIを使用したデプロイ

1. **Amplify CLIのインストール**

```bash
npm install -g @aws-amplify/cli
```

2. **Amplifyの初期化**

```bash
amplify init
```

設定例：

```
? Enter a name for the project: ai-agent-calendar
? Initialize the project with the above configuration? Yes
? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use: default
```

3. **ホスティングの追加**

```bash
amplify add hosting
```

選択肢：

```
? Select the plugin module to execute: Amazon CloudFront and S3
? Select the environment setup: PROD (S3 with CloudFront using HTTPS)
? hosting bucket name: ai-agent-calendar-hosting
```

4. **環境変数の設定**

```bash
amplify env add
```

または、AWS Systems Manager Parameter Storeを使用：

```bash
# パラメータストアに環境変数を保存
aws ssm put-parameter \
  --name "/amplify/ai-agent-calendar/main/OPENAI_API_KEY" \
  --value "your_openai_api_key_here" \
  --type "SecureString"
```

5. **デプロイの実行**

```bash
amplify publish
```

#### 3. 継続的デプロイメントの設定

1. **ブランチの自動デプロイ**

   - Amplifyコンソールで「Branch settings」を設定
   - mainブランチへのプッシュで自動デプロイ

2. **プルリクエストプレビュー**
   - 「Previews」タブでプルリクエストごとのプレビュー環境を有効化

#### 4. カスタムドメインの設定

1. **ドメインの追加**

   - App settings → Domain management
   - 「Add domain」をクリック

2. **DNS設定**
   - Route 53を使用する場合は自動設定
   - 外部DNSの場合はCNAMEレコードを手動設定

#### 5. パフォーマンス最適化

1. **キャッシュ設定**

   - CloudFrontの設定でキャッシュポリシーを最適化

2. **環境変数の暗号化**
   - 本番環境では機密情報をAWS Secrets Managerで管理

```bash
# Secrets Managerにシークレットを作成
aws secretsmanager create-secret \
  --name "ai-agent-calendar/openai-key" \
  --secret-string "your_openai_api_key_here"
```

#### トラブルシューティング

- **ビルドエラー**: `amplify.yml`でNode.jsバージョンを指定
- **環境変数が反映されない**: デプロイ後にアプリを再起動
- **カスタムドメインが機能しない**: DNS伝播に時間がかかる場合があります（最大48時間）

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
