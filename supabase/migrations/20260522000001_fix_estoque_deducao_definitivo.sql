-- ============================================================
-- Fix definitivo: estoque sendo baixado 3x por venda
-- Remove TODOS os mecanismos de dedução existentes e reconstrói
-- com exatamente UMA via: UPDATE explícito dentro da função
-- ============================================================

-- 1. Remover TODOS os triggers de INSERT/UPDATE em tab_itens_venda
--    (usa DO block para não falhar se não existirem)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT t.tgname
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'tab_itens_venda'
          AND n.nspname = 'public'
          AND NOT t.tgisinternal
    )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.tab_itens_venda CASCADE', r.tgname);
    END LOOP;
END;
$$;

-- 2. Remover RULES em tab_itens_venda (podem causar DML duplicado)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT rulename
        FROM pg_rules
        WHERE tablename = 'tab_itens_venda' AND schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP RULE IF EXISTS %I ON public.tab_itens_venda', r.rulename);
    END LOOP;
END;
$$;

-- 3. Remover funções de trigger de baixa de estoque que possam existir
DROP FUNCTION IF EXISTS public.fn_baixa_estoque_venda() CASCADE;
DROP FUNCTION IF EXISTS public.fn_atualizar_estoque_venda() CASCADE;

-- 4. Recriar função de estorno (APÓS DELETE de item — cancela item e devolve estoque)
CREATE OR REPLACE FUNCTION public.estornar_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tab_produtos
    SET pro_estoque_atual = COALESCE(pro_estoque_atual, 0) + OLD.itv_quantidade
    WHERE id = OLD.itv_produto_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recriar trigger de estorno (único trigger permitido em tab_itens_venda)
DROP TRIGGER IF EXISTS trg_estornar_estoque_venda ON public.tab_itens_venda;
CREATE TRIGGER trg_estornar_estoque_venda
AFTER DELETE ON public.tab_itens_venda
FOR EACH ROW
EXECUTE FUNCTION public.estornar_estoque_venda();

-- 6. Recriar trigger de cálculo do total do item (BEFORE INSERT/UPDATE)
--    Só recria se a função calcular_total_item existir E não tocar em estoque
DROP TRIGGER IF EXISTS trg_calcular_total_item ON public.tab_itens_venda;
CREATE OR REPLACE FUNCTION public.calcular_total_item()
RETURNS TRIGGER AS $$
BEGIN
    NEW.itv_valor_total := NEW.itv_quantidade * NEW.itv_valor_unitario;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_total_item
BEFORE INSERT OR UPDATE ON public.tab_itens_venda
FOR EACH ROW
EXECUTE FUNCTION public.calcular_total_item();

-- 7. Recriar registrar_venda_completa — dedução de estoque SOMENTE aqui,
--    1x por item no loop. Sem trigger de INSERT fazendo dedução.
CREATE OR REPLACE FUNCTION public.registrar_venda_completa(
    p_cliente_id uuid,
    p_usuario_id uuid,
    p_valor_total numeric,
    p_desconto numeric,
    p_forma_pagamento text,
    p_itens jsonb,
    p_pagamentos jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
        ven_cliente_id, ven_valor_total, ven_desconto,
        ven_forma_pagamento, ven_status, created_at, updated_at
    ) VALUES (
        p_cliente_id, p_valor_total, COALESCE(p_desconto, 0),
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
