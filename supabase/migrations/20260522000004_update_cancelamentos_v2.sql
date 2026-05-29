-- Adiciona cupom fiscal e melhora tipos na tabela de cancelamentos
ALTER TABLE public.tab_cancelamentos
    ADD COLUMN IF NOT EXISTS can_cupom_fiscal text,
    ADD COLUMN IF NOT EXISTS can_itens_snapshot jsonb DEFAULT '[]'::jsonb;

-- Atualiza função cancelar_venda para aceitar cupom fiscal
CREATE OR REPLACE FUNCTION public.cancelar_venda(
    p_venda_id uuid,
    p_motivo text DEFAULT NULL,
    p_cupom_fiscal text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_estoque_snapshot jsonb := '[]'::jsonb;
    v_valor_total numeric;
BEGIN
    FOR v_item IN
        SELECT iv.id, iv.itv_produto_id, iv.itv_quantidade,
               p.pro_descricao, p.pro_estoque_atual
        FROM public.tab_itens_venda iv
        JOIN public.tab_produtos p ON p.id = iv.itv_produto_id
        WHERE iv.itv_venda_id = p_venda_id AND iv.itv_status = 'ativo'
    LOOP
        v_estoque_snapshot := v_estoque_snapshot || jsonb_build_array(
            jsonb_build_object(
                'produto_id',              v_item.itv_produto_id,
                'descricao',               v_item.pro_descricao,
                'estoque_no_cancelamento', v_item.pro_estoque_atual,
                'quantidade_cancelada',    v_item.itv_quantidade
            )
        );
        UPDATE public.tab_produtos
        SET pro_estoque_atual = pro_estoque_atual + v_item.itv_quantidade, updated_at = now()
        WHERE id = v_item.itv_produto_id;
        UPDATE public.tab_itens_venda SET itv_status = 'cancelado' WHERE id = v_item.id;
    END LOOP;

    SELECT ven_valor_total INTO v_valor_total FROM public.tab_vendas WHERE id = p_venda_id;
    UPDATE public.tab_vendas SET ven_status = 'cancelada', updated_at = now() WHERE id = p_venda_id;

    INSERT INTO public.tab_cancelamentos (
        can_venda_id, can_cupom_fiscal, can_tipo, can_motivo,
        can_estoque_snapshot, can_valor_cancelado
    ) VALUES (
        p_venda_id, p_cupom_fiscal, 'venda_completa', p_motivo,
        v_estoque_snapshot, COALESCE(v_valor_total, 0)
    );
END;
$$;
