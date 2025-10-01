# デプロイガイド

## 手順1: Supabaseプロジェクトのセットアップ

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com/)にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト名: `genrigensoku-quiz`（または任意の名前）
4. データベースパスワードを設定（安全な場所に保存）
5. リージョンを選択（推奨: Northeast Asia (Tokyo)）
6. 「Create new project」をクリック

### 1.2 データベーステーブルの作成

1. Supabaseダッシュボードで、左メニューから「SQL Editor」を選択
2. 「New Query」をクリック
3. プロジェクトフォルダ内の `supabase-setup.sql` の内容を全てコピー
4. SQLエディタにペースト
5. 「Run」をクリックして実行

### 1.3 Supabase認証情報の取得

1. Supabaseダッシュボードで、左メニューから「Project Settings」→「API」を選択
2. 以下の2つの値をメモ：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`（長い文字列）

## 手順2: GitHubリポジトリの作成とプッシュ

### 2.1 GitHubで新規リポジトリを作成

1. [GitHub](https://github.com/)にログイン
2. 右上の「+」→「New repository」をクリック
3. Repository name: `genrigensoku-quiz`（または任意の名前）
4. Public または Private を選択
5. 「Create repository」をクリック

### 2.2 ローカルリポジトリをプッシュ

コマンドプロンプトまたはターミナルで以下を実行：

```bash
cd C:\claudecode\genrigensoku-test

# リモートリポジトリを追加（GitHubのURLに置き換えてください）
git remote add origin https://github.com/YOUR-USERNAME/genrigensoku-quiz.git

# プッシュ
git push -u origin main
```

**注意**: `YOUR-USERNAME` を実際のGitHubユーザー名に置き換えてください。

## 手順3: Vercelへのデプロイ

### 3.1 Vercelアカウントの作成/ログイン

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」または「Log In」
3. GitHubアカウントで認証することを推奨

### 3.2 プロジェクトのインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションで、先ほど作成したGitHubリポジトリを選択
3. 「Import」をクリック

### 3.3 環境変数の設定

「Configure Project」画面で：

1. 「Environment Variables」セクションを展開
2. 以下の2つの環境変数を追加：

**変数1:**
- Name: `VITE_SUPABASE_URL`
- Value: Supabaseから取得したProject URL（例: `https://xxxxxxxxxxxxx.supabase.co`）

**変数2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: Supabaseから取得したanon public key

3. 「Deploy」をクリック

### 3.4 デプロイ完了

- 数分でデプロイが完了します
- 完了すると、公開URLが表示されます（例: `https://genrigensoku-quiz.vercel.app`）
- このURLにアクセスして、アプリが正常に動作するか確認してください

## 手順4: 動作確認

1. デプロイされたURLにアクセス
2. 氏名を入力してクイズを開始
3. クイズを完了して結果が保存されるか確認
4. ダッシュボードで結果が表示されるか確認

## トラブルシューティング

### 「データベース接続エラー」が表示される場合

- Vercelの環境変数が正しく設定されているか確認
- Supabaseの認証情報（URLとAnon Key）が正しいか確認
- SupabaseでRLS（Row Level Security）ポリシーが正しく設定されているか確認

### データが保存されない場合

1. Supabaseダッシュボード→「Table Editor」で `quiz_results` テーブルが存在するか確認
2. ブラウザの開発者ツール（F12）を開いてコンソールエラーを確認
3. Supabaseの「Authentication」→「Policies」でポリシーが有効になっているか確認

### 更新をデプロイする場合

```bash
cd C:\claudecode\genrigensoku-test
git add .
git commit -m "更新内容の説明"
git push
```

Vercelは自動的に最新のコミットをデプロイします。

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Domains」
3. カスタムドメインを追加して、DNSレコードを設定

---

## サポート

問題が発生した場合：
- Supabaseドキュメント: https://supabase.com/docs
- Vercelドキュメント: https://vercel.com/docs
- GitHubリポジトリのIssuesセクション
