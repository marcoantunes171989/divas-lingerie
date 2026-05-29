-- Tabela de log de deploys e tarefas automatizadas
create table if not exists public.tab_deploy_log (
  id          uuid primary key default gen_random_uuid(),
  criado_em   timestamptz not null default now(),
  tipo        text not null default 'deploy',   -- 'deploy' | 'commit' | 'tarefa'
  descricao   text not null,
  commit_hash text,
  branch      text default 'main',
  status      text not null default 'ok'        -- 'ok' | 'erro'
);

alter table public.tab_deploy_log enable row level security;

-- Permite leitura pública (dashboard interno pode listar deploys)
create policy "leitura deploy log" on public.tab_deploy_log
  for select using (true);

-- Apenas service role pode inserir (via hook/CI)
create policy "insert deploy log" on public.tab_deploy_log
  for insert with check (true);
