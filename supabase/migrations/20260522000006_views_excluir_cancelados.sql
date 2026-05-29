-- Recria as views excluindo vendas e itens cancelados
-- Usa DROP + CREATE (não OR REPLACE) para permitir alteração de colunas

DROP VIEW IF EXISTS public.view_resumo_vendas_diario;
CREATE VIEW public.view_resumo_vendas_diario AS
SELECT
    (v.created_at AT TIME ZONE 'UTC')::date AS data_referencia,
    COUNT(v.id) AS total_vendas,
    SUM(v.ven_valor_total) AS volume_vendas,
    SUM(v.ven_valor_total - COALESCE(
        (SELECT SUM(p.pro_valor_compra * iv.itv_quantidade)
         FROM public.tab_itens_venda iv
         JOIN public.tab_produtos p ON iv.itv_produto_id = p.id
         WHERE iv.itv_venda_id = v.id AND iv.itv_status = 'ativo'), 0
    )) AS lucro_total
FROM public.tab_vendas v
WHERE v.ven_status != 'cancelada'
GROUP BY 1;

DROP VIEW IF EXISTS public.view_formas_pagamento_stats;
CREATE VIEW public.view_formas_pagamento_stats AS
SELECT
    ven_forma_pagamento AS forma_pagamento,
    COUNT(id) AS total_vendas,
    SUM(ven_valor_total) AS volume_financeiro
FROM public.tab_vendas
WHERE ven_status != 'cancelada'
GROUP BY 1;

DROP VIEW IF EXISTS public.view_top_produtos;
CREATE VIEW public.view_top_produtos AS
SELECT
    p.id AS produto_id,
    p.pro_descricao AS descricao,
    SUM(iv.itv_quantidade) AS total_vendido,
    SUM(iv.itv_valor_total) AS receita_total
FROM public.tab_itens_venda iv
JOIN public.tab_produtos p ON iv.itv_produto_id = p.id
WHERE iv.itv_status = 'ativo'
GROUP BY 1, 2
ORDER BY 3 DESC;

GRANT SELECT ON public.view_resumo_vendas_diario TO authenticated;
GRANT SELECT ON public.view_formas_pagamento_stats TO authenticated;
GRANT SELECT ON public.view_top_produtos TO authenticated;
