-- Campo de observação para cadastro rápido de lead/cliente na tela CRM Intelligence
ALTER TABLE public.tab_clientes ADD COLUMN IF NOT EXISTS cli_observacao TEXT;
