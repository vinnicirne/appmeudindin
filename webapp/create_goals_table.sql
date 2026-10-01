-- Tabela para Metas Financeiras e Sonhos (Cofrinhos / Objetivos)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  icon TEXT DEFAULT 'savings',
  color TEXT DEFAULT 'bg-emerald-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias metas" ON public.goals;
CREATE POLICY "Usuários podem gerenciar suas próprias metas"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id);
