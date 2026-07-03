-- ============================================================
-- Controle de Caixa (abertura/fechamento/sangria/suprimento)
-- + Vendedor na venda (distinto do operador logado)
-- ============================================================

-- 1. Tabela de caixa
CREATE TABLE public.tab_caixa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cai_terminal TEXT NOT NULL DEFAULT '01',
    cai_operador_id UUID REFERENCES public.tab_usuarios(id),
    cai_status TEXT NOT NULL DEFAULT 'aberto' CHECK (cai_status IN ('aberto', 'fechado')),
    cai_valor_abertura NUMERIC(10,2) NOT NULL DEFAULT 0,
    cai_valor_fechamento NUMERIC(10,2),
    cai_data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    cai_data_fechamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Garante no máximo um caixa aberto por terminal
CREATE UNIQUE INDEX idx_tab_caixa_terminal_aberto
    ON public.tab_caixa (cai_terminal)
    WHERE cai_status = 'aberto';

ALTER TABLE public.tab_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caixa viewable by everyone"
ON public.tab_caixa FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage caixa"
ON public.tab_caixa FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_tab_caixa_updated_at
BEFORE UPDATE ON public.tab_caixa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela de movimentações de caixa (sangria/suprimento)
CREATE TABLE public.tab_movimentacoes_caixa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mov_caixa_id UUID NOT NULL REFERENCES public.tab_caixa(id) ON DELETE CASCADE,
    mov_tipo TEXT NOT NULL CHECK (mov_tipo IN ('sangria', 'suprimento')),
    mov_valor NUMERIC(10,2) NOT NULL CHECK (mov_valor > 0),
    mov_motivo TEXT,
    mov_operador_id UUID REFERENCES public.tab_usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tab_movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movimentacoes caixa viewable by everyone"
ON public.tab_movimentacoes_caixa FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage movimentacoes caixa"
ON public.tab_movimentacoes_caixa FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_tab_movimentacoes_caixa_caixa_id ON public.tab_movimentacoes_caixa(mov_caixa_id);

-- 3. Vendedor e rastreabilidade de caixa na venda
ALTER TABLE public.tab_vendas
    ADD COLUMN ven_vendedor_id UUID REFERENCES public.tab_usuarios(id),
    ADD COLUMN ven_caixa_id UUID REFERENCES public.tab_caixa(id);

-- 4. RPC: abrir caixa
CREATE OR REPLACE FUNCTION public.abrir_caixa(
    p_operador_id UUID,
    p_valor_abertura NUMERIC,
    p_terminal TEXT DEFAULT '01'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_caixa_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.tab_caixa
        WHERE cai_terminal = p_terminal AND cai_status = 'aberto'
    ) THEN
        RAISE EXCEPTION 'Já existe um caixa aberto no terminal %.', p_terminal;
    END IF;

    INSERT INTO public.tab_caixa (
        cai_terminal, cai_operador_id, cai_valor_abertura, cai_status, cai_data_abertura
    ) VALUES (
        p_terminal, p_operador_id, COALESCE(p_valor_abertura, 0), 'aberto', now()
    ) RETURNING id INTO v_caixa_id;

    RETURN v_caixa_id;
END;
$function$;

-- 5. RPC: fechar caixa
CREATE OR REPLACE FUNCTION public.fechar_caixa(
    p_caixa_id UUID,
    p_valor_fechamento NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.tab_caixa
    SET cai_status = 'fechado',
        cai_valor_fechamento = p_valor_fechamento,
        cai_data_fechamento = now(),
        updated_at = now()
    WHERE id = p_caixa_id AND cai_status = 'aberto';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Caixa % não encontrado ou já está fechado.', p_caixa_id;
    END IF;
END;
$function$;

-- 6. RPC: registrar sangria/suprimento
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_caixa(
    p_caixa_id UUID,
    p_tipo TEXT,
    p_valor NUMERIC,
    p_motivo TEXT,
    p_operador_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_mov_id UUID;
    v_status TEXT;
BEGIN
    IF p_tipo NOT IN ('sangria', 'suprimento') THEN
        RAISE EXCEPTION 'Tipo de movimentação inválido: %', p_tipo;
    END IF;

    SELECT cai_status INTO v_status FROM public.tab_caixa WHERE id = p_caixa_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Caixa % não encontrado.', p_caixa_id;
    END IF;
    IF v_status != 'aberto' THEN
        RAISE EXCEPTION 'Caixa não está aberto.';
    END IF;

    INSERT INTO public.tab_movimentacoes_caixa (
        mov_caixa_id, mov_tipo, mov_valor, mov_motivo, mov_operador_id
    ) VALUES (
        p_caixa_id, p_tipo, p_valor, p_motivo, p_operador_id
    ) RETURNING id INTO v_mov_id;

    RETURN v_mov_id;
END;
$function$;

-- 7. Estende registrar_venda_completa: vendedor, caixa e grava o operador (ven_usuario_id)
CREATE OR REPLACE FUNCTION public.registrar_venda_completa(
    p_cliente_id uuid,
    p_usuario_id uuid,
    p_valor_total numeric,
    p_desconto numeric,
    p_forma_pagamento text,
    p_itens jsonb,
    p_pagamentos jsonb DEFAULT NULL::jsonb,
    p_vendedor_id uuid DEFAULT NULL::uuid,
    p_caixa_id uuid DEFAULT NULL::uuid
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
    -- Garante que usuário existe (evita FK violation sem remover a constraint)
    IF p_usuario_id IS NOT NULL THEN
        INSERT INTO public.tab_usuarios (id, usu_nome)
        VALUES (p_usuario_id, 'Usuário')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Validação de finalizadoras (pula se finalizadora_id não informado)
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

    -- Validação de estoque antes de qualquer inserção
    FOR v_item IN
        SELECT * FROM jsonb_to_recordset(p_itens)
            AS x(produto_id UUID, quantidade INT, valor_unitario NUMERIC, valor_total NUMERIC)
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

    -- Inserção do cabeçalho da venda
    INSERT INTO public.tab_vendas (
        ven_cliente_id, ven_usuario_id, ven_vendedor_id, ven_caixa_id,
        ven_valor_total, ven_desconto,
        ven_forma_pagamento, ven_status, created_at, updated_at
    ) VALUES (
        p_cliente_id, p_usuario_id, p_vendedor_id, p_caixa_id,
        p_valor_total, COALESCE(p_desconto, 0),
        p_forma_pagamento, 'concluida', now(), now()
    ) RETURNING id INTO v_venda_id;

    -- Inserção dos itens + dedução de estoque (1x por item, controlada aqui)
    FOR v_item IN
        SELECT * FROM jsonb_to_recordset(p_itens)
            AS x(produto_id UUID, quantidade INT, valor_unitario NUMERIC, valor_total NUMERIC)
    LOOP
        INSERT INTO public.tab_itens_venda (
            itv_venda_id, itv_produto_id, itv_quantidade,
            itv_valor_unitario, itv_valor_total, itv_status, created_at
        ) VALUES (
            v_venda_id, v_item.produto_id, v_item.quantidade,
            v_item.valor_unitario, v_item.valor_total, 'ativo', now()
        );

        -- ÚNICA dedução de estoque — sem trigger de INSERT fazendo o mesmo
        UPDATE public.tab_produtos
           SET pro_estoque_atual = pro_estoque_atual - v_item.quantidade,
               updated_at = now()
         WHERE id = v_item.produto_id;
    END LOOP;

    -- Registro dos pagamentos
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
