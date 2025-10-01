-- 経営の原理原則クイズ - Supabase テーブル設定

-- quiz_resultsテーブルの作成
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_name TEXT NOT NULL,
  normalized_user_name TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- インデックスの作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_normalized_user_name ON quiz_results(normalized_user_name);
CREATE INDEX IF NOT EXISTS idx_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON quiz_results(created_at DESC);

-- RLS (Row Level Security) の設定
-- 匿名ユーザーでも読み書きできるように設定
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Enable read access for all users" ON quiz_results
  FOR SELECT
  USING (true);

-- 全ユーザーが挿入可能
CREATE POLICY "Enable insert access for all users" ON quiz_results
  FOR INSERT
  WITH CHECK (true);

-- ダッシュボード用のビュー作成（オプション）
CREATE OR REPLACE VIEW user_quiz_stats AS
SELECT
  normalized_user_name,
  user_name,
  quiz_id,
  quiz_title,
  MAX(percentage) as highest_score,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM quiz_results
GROUP BY normalized_user_name, user_name, quiz_id, quiz_title;
