-- Etapa 2: esquema de datos personal (un solo usuario, protegido por RLS via auth.uid())

create table if not exists targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  proteina numeric not null default 160,
  kcal numeric not null default 2600,
  updated_at timestamptz not null default now()
);

create table if not exists meals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  nombre text not null,
  gramos numeric not null,
  hora text not null,
  proteina numeric not null default 0,
  carbs numeric not null default 0,
  grasas numeric not null default 0,
  kcal numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists meals_user_fecha_idx on meals (user_id, fecha);

create table if not exists body_metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  peso numeric,
  created_at timestamptz not null default now()
);
create index if not exists body_metrics_user_fecha_idx on body_metrics (user_id, fecha);

alter table targets enable row level security;
alter table meals enable row level security;
alter table body_metrics enable row level security;

create policy "targets: owner only" on targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals: owner only" on meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "body_metrics: owner only" on body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
