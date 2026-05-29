-- Tabela de controle de sequência do cupom fiscal
CREATE TABLE IF NOT EXISTS public.tab_sequencia_cupom (
    id integer PRIMARY KEY DEFAULT 1,
    seq_atual integer NOT NULL DEFAULT 0,
    CONSTRAINT apenas_uma_linha CHECK (id = 1)
);

INSERT INTO public.tab_sequencia_cupom (id, seq_atual)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.tab_sequencia_cupom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem acessar sequencia_cupom"
ON public.tab_sequencia_cupom
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função: retorna o próximo número sequencial (atômico)
CREATE OR REPLACE FUNCTION public.proximo_cupom_fiscal()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_numero integer;
BEGIN
    UPDATE public.tab_sequencia_cupom
       SET seq_atual = seq_atual + 1
     WHERE id = 1
    RETURNING seq_atual INTO v_numero;
    RETURN v_numero;
END;
$$;

-- Função: reseta a sequência para zero (admin)
CREATE OR REPLACE FUNCTION public.resetar_sequencia_cupom()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.tab_sequencia_cupom SET seq_atual = 0 WHERE id = 1;
END;
$$;
