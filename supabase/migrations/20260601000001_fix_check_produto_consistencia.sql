-- Corrige check_produto_consistencia: a versão antiga referenciava tabelas inexistentes
-- (public.produtos / public.posses). As tabelas reais são tab_produtos e tab_consignacao.
-- (Já aplicada no banco via Supabase MCP; este arquivo documenta/versiona a alteração.)
CREATE OR REPLACE FUNCTION public.check_produto_consistencia(p_produto_id uuid)
RETURNS TABLE(em_estoque integer, em_posse bigint, total_registrado bigint, is_consistente boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH resumo AS (
    SELECT
      COALESCE(p.pro_estoque_atual, 0) AS estoque,
      COALESCE((
        SELECT SUM(c.con_quantidade)
        FROM public.tab_consignacao c
        WHERE c.con_produto_id = p.id AND c.con_status = 'em_posse'
      ), 0) AS posse_qtd
    FROM public.tab_produtos p
    WHERE p.id = p_produto_id
  )
  SELECT
    r.estoque::integer,
    r.posse_qtd::bigint,
    (r.estoque + r.posse_qtd)::bigint,
    (r.estoque >= 0)
  FROM resumo r;
END;
$$;
