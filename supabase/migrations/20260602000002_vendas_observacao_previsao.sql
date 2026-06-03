-- Observação e previsão de pagamento na venda (exibidas no cupom não fiscal e relatórios).
-- (Já aplicada no banco via Supabase MCP; este arquivo documenta/versiona.)
ALTER TABLE public.tab_vendas
  ADD COLUMN IF NOT EXISTS ven_observacao text,
  ADD COLUMN IF NOT EXISTS ven_previsao_pagamento date;

CREATE OR REPLACE FUNCTION public.definir_dados_venda(
  p_venda_id uuid,
  p_observacao text DEFAULT NULL,
  p_previsao_pagamento date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tab_vendas
     SET ven_observacao = p_observacao,
         ven_previsao_pagamento = p_previsao_pagamento,
         updated_at = now()
   WHERE id = p_venda_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.definir_dados_venda(uuid, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_dados_venda(uuid, text, date) TO authenticated;
