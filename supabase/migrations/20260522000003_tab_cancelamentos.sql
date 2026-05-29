-- Tabela de histórico de cancelamentos
CREATE TABLE IF NOT EXISTS public.tab_cancelamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    can_venda_id uuid REFERENCES public.tab_vendas(id) ON DELETE SET NULL,
    can_tipo text NOT NULL DEFAULT 'venda_completa', -- 'venda_completa'
    can_motivo text,
    can_estoque_snapshot jsonb DEFAULT '[]'::jsonb,
    can_valor_cancelado numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tab_cancelamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem gerenciar cancelamentos"
ON public.tab_cancelamentos
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função para cancelar venda completa
CREATE OR REPLACE FUNCTION public.cancelar_venda(
    p_venda_id uuid,
    p_motivo text DEFAULT NULL
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
    -- Snapshot do estoque antes de restaurar
    FOR v_item IN
        SELECT
            iv.id,
            iv.itv_produto_id,
            iv.itv_quantidade,
            p.pro_descricao,
            p.pro_estoque_atual
        FROM public.tab_itens_venda iv
        JOIN public.tab_produtos p ON p.id = iv.itv_produto_id
        WHERE iv.itv_venda_id = p_venda_id
          AND iv.itv_status = 'ativo'
    LOOP
        v_estoque_snapshot := v_estoque_snapshot || jsonb_build_array(
            jsonb_build_object(
                'produto_id',     v_item.itv_produto_id,
                'descricao',      v_item.pro_descricao,
                'estoque_no_cancelamento', v_item.pro_estoque_atual,
                'quantidade_cancelada',    v_item.itv_quantidade
            )
        );

        -- Devolve estoque
        UPDATE public.tab_produtos
        SET pro_estoque_atual = pro_estoque_atual + v_item.itv_quantidade,
            updated_at = now()
        WHERE id = v_item.itv_produto_id;

        -- Marca item como cancelado
        UPDATE public.tab_itens_venda
        SET itv_status = 'cancelado'
        WHERE id = v_item.id;
    END LOOP;

    -- Valor da venda cancelada
    SELECT ven_valor_total INTO v_valor_total
    FROM public.tab_vendas WHERE id = p_venda_id;

    -- Marca venda como cancelada
    UPDATE public.tab_vendas
    SET ven_status = 'cancelada', updated_at = now()
    WHERE id = p_venda_id;

    -- Registra no histórico
    INSERT INTO public.tab_cancelamentos (
        can_venda_id, can_tipo, can_motivo,
        can_estoque_snapshot, can_valor_cancelado
    ) VALUES (
        p_venda_id, 'venda_completa', p_motivo,
        v_estoque_snapshot, COALESCE(v_valor_total, 0)
    );
END;
$$;
