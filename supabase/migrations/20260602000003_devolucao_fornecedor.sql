-- Devolução de produtos ao fornecedor (zera o estoque dos produtos selecionados e registra).
-- (Já aplicada no banco via Supabase MCP; este arquivo documenta/versiona.)
CREATE TABLE IF NOT EXISTS public.tab_devolucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dev_data date NOT NULL DEFAULT CURRENT_DATE,
  dev_motivo text,
  dev_fornecedor_id uuid REFERENCES public.tab_fornecedores(id) ON DELETE SET NULL,
  dev_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  dev_valor_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tab_devolucoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Autenticados gerenciam devolucoes" ON public.tab_devolucoes;
CREATE POLICY "Autenticados gerenciam devolucoes" ON public.tab_devolucoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.registrar_devolucao_fornecedor(
  p_produto_ids uuid[],
  p_motivo text DEFAULT NULL,
  p_data date DEFAULT CURRENT_DATE,
  p_fornecedor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_item RECORD;
  v_dev_id uuid;
BEGIN
  FOR v_item IN
    SELECT id, pro_descricao, pro_codigo, pro_estoque_atual, pro_valor_venda
    FROM public.tab_produtos
    WHERE id = ANY(p_produto_ids) AND COALESCE(pro_estoque_atual, 0) > 0
  LOOP
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'produto_id',     v_item.id,
      'codigo',         v_item.pro_codigo,
      'descricao',      v_item.pro_descricao,
      'quantidade',     v_item.pro_estoque_atual,
      'valor_unitario', v_item.pro_valor_venda,
      'valor_total',    COALESCE(v_item.pro_estoque_atual,0) * COALESCE(v_item.pro_valor_venda,0)
    ));
    v_total := v_total + COALESCE(v_item.pro_estoque_atual,0) * COALESCE(v_item.pro_valor_venda,0);
    UPDATE public.tab_produtos SET pro_estoque_atual = 0, updated_at = now() WHERE id = v_item.id;
  END LOOP;

  IF jsonb_array_length(v_snapshot) = 0 THEN
    RAISE EXCEPTION 'Nenhum produto com estoque maior que zero foi selecionado.';
  END IF;

  INSERT INTO public.tab_devolucoes (dev_data, dev_motivo, dev_fornecedor_id, dev_snapshot, dev_valor_total)
  VALUES (p_data, p_motivo, p_fornecedor_id, v_snapshot, v_total)
  RETURNING id INTO v_dev_id;
  RETURN v_dev_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_devolucao_fornecedor(uuid[], text, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_devolucao_fornecedor(uuid[], text, date, uuid) TO authenticated;
