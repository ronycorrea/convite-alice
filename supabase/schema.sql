-- =====================================================================
-- Convite Jade Helena 1 ano — banco de dados (Supabase)
-- Rode este arquivo inteiro no Supabase: SQL Editor → New query → Run.
-- Pode rodar de novo sem problema (é idempotente).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tabela de infraestrutura usada pelo ping que evita a pausa do
--    projeto no plano gratuito (.github/workflows/supabase-ping.yml).
-- ---------------------------------------------------------------------
create table if not exists public.ping (
  id smallint primary key default 1 check (id = 1)
);
insert into public.ping (id) values (1) on conflict (id) do nothing;

alter table public.ping enable row level security;
drop policy if exists "ping: leitura publica" on public.ping;
create policy "ping: leitura publica" on public.ping
  for select to anon, authenticated using (true);
grant select on public.ping to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Confirmações de presença enviadas pelo convite.
--    O convidado (chave pública) só consegue INSERIR. Ninguém de fora
--    consegue ler a lista: ela sai apenas pela função com senha abaixo.
-- ---------------------------------------------------------------------
create table if not exists public.confirmacoes (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nome       text not null check (char_length(btrim(nome)) between 1 and 120),
  adultos    smallint not null default 0 check (adultos between 0 and 20),
  criancas   smallint not null default 0 check (criancas between 0 and 20),
  vai        boolean not null default true,
  recado     text check (recado is null or char_length(recado) <= 500)
);

alter table public.confirmacoes enable row level security;
drop policy if exists "confirmacoes: convidado pode confirmar" on public.confirmacoes;
create policy "confirmacoes: convidado pode confirmar" on public.confirmacoes
  for insert to anon, authenticated with check (true);

revoke all on public.confirmacoes from anon, authenticated;
grant insert (nome, adultos, criancas, vai, recado) on public.confirmacoes to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Acesso do cliente à lista (página da tabela), protegido por senha.
--    A senha fica guardada só como hash (bcrypt), numa tabela sem acesso
--    público.
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_senha (
  id   smallint primary key default 1 check (id = 1),
  hash text not null
);
alter table public.admin_senha enable row level security;   -- sem policies = ninguém lê
revoke all on public.admin_senha from anon, authenticated;

create or replace function public._senha_ok(senha text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.admin_senha a
    where a.hash = extensions.crypt(coalesce(senha, ''), a.hash)
  );
$$;
revoke all on function public._senha_ok(text) from public, anon, authenticated;

-- Lista todas as respostas (mais recentes primeiro)
create or replace function public.listar_confirmacoes(senha text)
returns setof public.confirmacoes
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public._senha_ok(senha) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  return query select * from public.confirmacoes order by created_at desc;
end;
$$;
revoke all on function public.listar_confirmacoes(text) from public;
grant execute on function public.listar_confirmacoes(text) to anon, authenticated;

-- Apaga uma resposta (ex.: duplicada ou teste)
create or replace function public.apagar_confirmacao(senha text, confirmacao_id bigint)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._senha_ok(senha) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  delete from public.confirmacoes where id = confirmacao_id;
end;
$$;
revoke all on function public.apagar_confirmacao(text, bigint) from public;
grant execute on function public.apagar_confirmacao(text, bigint) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) DEFINA A SENHA DA PÁGINA DA TABELA
--    Troque TROQUE-ESTA-SENHA por uma senha forte e rode só este bloco.
--    Para mudar depois, é só rodar de novo com a nova senha.
-- ---------------------------------------------------------------------
-- insert into public.admin_senha (id, hash)
-- values (1, extensions.crypt('TROQUE-ESTA-SENHA', extensions.gen_salt('bf')))
-- on conflict (id) do update set hash = excluded.hash;
