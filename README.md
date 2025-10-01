# 経営の原理原則クイズ

全講座の原理原則を問う学習アプリケーション

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com/)にアクセス
2. 新規プロジェクトを作成
3. プロジェクトのURLとAnon Keyをメモ

### 2. データベースのセットアップ

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-setup.sql`の内容をコピー&ペースト
3. 実行してテーブルを作成

### 3. 環境変数の設定

ローカル開発の場合：
```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集してSupabase認証情報を入力
```

Vercelデプロイの場合：
- Vercelのダッシュボードで環境変数を設定
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. [Vercel](https://vercel.com/)にログイン
3. 「New Project」→ GitHubリポジトリを選択
4. 環境変数を設定：
   - `VITE_SUPABASE_URL`: SupabaseプロジェクトURL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
5. 「Deploy」をクリック

## ディレクトリ構造

```
genrigensoku-test/
├── index.html              # メインHTMLファイル
├── styles.css              # スタイルシート
├── app.js                  # メインアプリケーションロジック
├── quizData.js             # クイズデータ
├── supabase-setup.sql      # Supabaseテーブル設定SQL
├── .env.example            # 環境変数のテンプレート
├── .gitignore              # Git除外ファイル
└── README.md               # このファイル
```

## 機能

- ✅ 複数のクイズテスト（quiz1〜quiz11、summary）
- ✅ リアルタイム採点とフィードバック
- ✅ 結果のSupabaseへの保存
- ✅ 学習状況ダッシュボード
- ✅ ユーザー登録不要（匿名利用可能）

## 技術スタック

- **フロントエンド**: HTML, CSS (Tailwind), Vanilla JavaScript
- **バックエンド**: Supabase (PostgreSQL)
- **ホスティング**: Vercel
- **バージョン管理**: Git/GitHub

## ライセンス

MIT License
