-- ============================================================
-- Cadastro dedicado de Operadores PDV e Vendedores + obrigatoriedade na venda
-- ============================================================

-- 1. Operadores PDV
CREATE TABLE public.tab_operadores_pdv (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ope_nome TEXT NOT NULL,
    ope_login TEXT,
    ope_ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tab_operadores_pdv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operadores PDV viewable by everyone"
ON public.tab_operadores_pdv FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage operadores PDV"
ON public.tab_operadores_pdv FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_tab_operadores_pdv_updated_at
BEFORE UPDATE ON public.tab_operadores_pdv
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vendedores (cadastro dedicado, distinto dos usuarios do sistema)
CREATE TABLE public.tab_vendedores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vdr_nome TEXT NOT NULL,
    vdr_telefone TEXT,
    vdr_ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tab_vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores viewable by everyone"
ON public.tab_vendedores FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage vendedores"
ON public.tab_vendedores FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_tab_vendedores_updated_at
BEFORE UPDATE ON public.tab_vendedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. tab_vendas passa a referenciar o operador PDV selecionado na venda.
--    ven_vendedor_id (ja existente) passa a apontar para o novo cadastro de
--    vendedores; a constraint antiga (para tab_usuarios) e removida e a nova
--    e adicionada como NOT VALID para nao quebrar vendas antigas (cujo id
--    historico referenciava tab_usuarios).
ALTER TABLE public.tab_vendas
    ADD COLUMN ven_operador_pdv_id UUID REFERENCES public.tab_operadores_pdv(id);

ALTER TABLE public.tab_vendas
    DROP CONSTRAINT IF EXISTS tab_vendas_ven_vendedor_id_fkey;

ALTER TABLE public.tab_vendas
    ADD CONSTRAINT tab_vendas_ven_vendedor_id_fkey
    FOREIGN KEY (ven_vendedor_id) REFERENCES public.tab_vendedores(id) NOT VALID;

-- 4. Estende registrar_venda_completa para gravar o operador PDV selecionado
CREATE OR REPLACE FUNCTION public.registrar_venda_completa(
    p_cliente_id uuid,
    p_usuario_id uuid,
    p_valor_total numeric,
    p_desconto numeric,
    p_forma_pagamento text,
    p_itens jsonb,
    p_pagamentos jsonb DEFAULT NULL::jsonb,
    p_vendedor_id uuid DEFAULT NULL::uuid,
    p_caixa_id uuid DEFAULT NULL::uuid,
    p_acrescimo numeric DEFAULT 0,
    p_operador_pdv_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_venda_id UUID;
    v_item     RECORD;
    v_pagto    RECORD;
    v_total_pago   NUMERIC := 0;
    v_fin_status   BOOLEAN;
    v_fin_nome     TEXT;
    v_estoque_atual INT;
BEGIN
    IF p_usuario_id IS NOT NULL THEN
        INSERT INTO public.tab_usuarios (id, usu_nome)
        VALUES (p_usuario_id, 'Usuário')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    IF p_pagamentos IS NOT NULL AND jsonb_array_length(p_pagamentos) > 0 THEN
        FOR v_pagto IN
            SELECT * FROM jsonb_to_recordset(p_pagamentos)
                AS x(forma TEXT, valor NUMERIC, finalizadora_id UUID)
        LOOP
            IF v_pagto.finalizadora_id IS NULL THEN
                CONTINUE;
            END IF;

            SELECT fin_ativa, fin_descricao
              INTO v_fin_status, v_fin_nome
              FROM public.tab_finalizadoras
             WHERE id = v_pagto.finalizadora_id;

            IF v_fin_status IS NULL THEN
                RAISE EXCEPTION 'Finalizadora com ID % não encontrada.', v_pagto.finalizadora_id;
            END IF;
            IF v_fin_status = false THEN
                RAISE EXCEPTION 'A finalizadora "%" está inativa.', v_fin_nome;
            END IF;
        END LOOP;

        SELECT SUM((val->>'valor')::NUMERIC)
          INTO v_total_pago
          FROM jsonb_array_elements(p_pagamentos) AS val;

        IF v_total_pago < p_valor_total THEN
            RAISE EXCEPTION 'Valor pago (%) insuficiente. Total: %', v_total_pago, p_valor_total;
        END IF;
    END IF;

    FOR v_item IN
        SELECT * FROM jsonb_to_recordset(p_itens)
            AS x(produto_id UUID, quantidade INT, valor_unitario NUMERIC, valor_total NUMERIC, acrescimo NUMERIC)
    LOOP
        SELECT pro_estoque_atual
          INTO v_estoque_atual
          FROM public.tab_produtos
         WHERE id = v_item.produto_id;

        IF COALESCE(v_estoque_atual, 0) < v_item.quantidade THEN
            RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %',
                COALESCE(v_estoque_atual, 0), v_item.quantidade;
        END IF;
    END LOOP;

    INSERT INTO public.tab_vendas (
        ven_cliente_id, ven_usuario_id, ven_vendedor_id, ven_caixa_id, ven_operador_pdv_id,
        ven_valor_total, ven_desconto, ven_acrescimo,
        ven_forma_pagamento, ven_status, created_at, updated_at
    ) VALUES (
        p_cliente_id, p_usuario_id, p_vendedor_id, p_caixa_id, p_operador_pdv_id,
        p_valor_total, COALESCE(p_desconto, 0), COALESCE(p_acrescimo, 0),
        p_forma_pagamento, 'concluida', now(), now()
    ) RETURNING id INTO v_venda_id;

    FOR v_item IN
        SELECT * FROM jsonb_to_recordset(p_itens)
            AS x(produto_id UUID, quantidade INT, valor_unitario NUMERIC, valor_total NUMERIC, acrescimo NUMERIC)
    LOOP
        INSERT INTO public.tab_itens_venda (
            itv_venda_id, itv_produto_id, itv_quantidade,
            itv_valor_unitario, itv_valor_total, itv_acrescimo, itv_status, created_at
        ) VALUES (
            v_venda_id, v_item.produto_id, v_item.quantidade,
            v_item.valor_unitario, v_item.valor_total, COALESCE(v_item.acrescimo, 0), 'ativo', now()
        );

        UPDATE public.tab_produtos
           SET pro_estoque_atual = pro_estoque_atual - v_item.quantidade,
               updated_at = now()
         WHERE id = v_item.produto_id;
    END LOOP;

    IF p_pagamentos IS NOT NULL THEN
        FOR v_pagto IN
            SELECT * FROM jsonb_to_recordset(p_pagamentos)
                AS x(forma TEXT, valor NUMERIC, finalizadora_id UUID)
        LOOP
            INSERT INTO public.tab_vendas_pagamentos (
                vpa_venda_id, vpa_forma_pagamento, vpa_valor, vpa_finalizadora_id
            ) VALUES (
                v_venda_id, v_pagto.forma, v_pagto.valor, v_pagto.finalizadora_id
            );
        END LOOP;
    END IF;

    RETURN v_venda_id;
END;
$function$;
