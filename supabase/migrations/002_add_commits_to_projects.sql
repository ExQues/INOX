-- Adiciona as colunas scene_graph e commits na tabela projects se não existirem
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS scene_graph JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS commits JSONB DEFAULT '[]';