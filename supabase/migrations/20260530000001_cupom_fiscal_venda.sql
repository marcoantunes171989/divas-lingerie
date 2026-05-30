-- Persiste o número do cupom fiscal na venda, para uso no reenvio de recibo e relatórios.
-- Antes, o número era gerado apenas no front-end e nunca salvo, exibindo "Nº ---".

-- 1. Coluna que guarda o número do cupom fiscal na venda
ALTER TABLE public.tab_vendas
    ADD COLUMN IF NOT EXISTS ven_cupom_fiscal text;

-- 2. Função para gravar o cupom fiscal na venda (SECURITY DEFINER evita problemas de RLS)
CREATE OR REPLACE FUNCTION public.definir_cupom_fiscal(
    p_venda_id uuid,
    p_cupom_fiscal text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tab_vendas
       SET ven_cupom_fiscal = p_cupom_fiscal,
           updated_at = now()
     WHERE id = p_venda_id;
END;
$$;
