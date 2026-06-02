-- Campos adicionais para um cadastro de fornecedor mais completo.
-- (Já aplicada no banco via Supabase MCP; este arquivo documenta/versiona a alteração.)
ALTER TABLE public.tab_fornecedores
  ADD COLUMN IF NOT EXISTS for_telefone text,
  ADD COLUMN IF NOT EXISTS for_celular text,
  ADD COLUMN IF NOT EXISTS for_email text,
  ADD COLUMN IF NOT EXISTS for_contato text,
  ADD COLUMN IF NOT EXISTS for_inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS for_complemento text;
