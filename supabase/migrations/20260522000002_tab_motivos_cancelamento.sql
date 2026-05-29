CREATE TABLE IF NOT EXISTS public.tab_motivos_cancelamento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mot_codigo integer GENERATED ALWAYS AS IDENTITY,
    mot_descricao text NOT NULL,
    mot_ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tab_motivos_cancelamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem gerenciar motivos_cancelamento"
ON public.tab_motivos_cancelamento
FOR ALL TO authenticated USING (true) WITH CHECK (true);
