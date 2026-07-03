-- A migration anterior usou CREATE OR REPLACE com uma nova lista de parâmetros,
-- o que o Postgres tratou como um NOVO overload em vez de substituir a função
-- existente. Remove o overload antigo (7 parâmetros) para evitar ambiguidade
-- de resolução de função no PostgREST.
DROP FUNCTION IF EXISTS public.registrar_venda_completa(
    uuid, uuid, numeric, numeric, text, jsonb, jsonb
);
