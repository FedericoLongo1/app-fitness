-- Etapa 2: esquema de datos personal (un solo usuario, protegido por RLS via auth.uid())

create table if not exists targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  proteina numeric not null default 160,
  kcal numeric not null default 2600,
  objetivo text not null default 'mantenimiento',
  updated_at timestamptz not null default now()
);

-- Etapa 4: si la tabla ya existía sin esta columna
alter table targets add column if not exists objetivo text not null default 'mantenimiento';

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

-- Etapa 3: entrenos (pesas + running)

create table if not exists routine_templates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  ejercicios jsonb not null default '[]', -- [{ ejercicio_id, orden }]
  created_at timestamptz not null default now()
);
create index if not exists routine_templates_user_idx on routine_templates (user_id);

create table if not exists workouts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  template_id bigint references routine_templates(id) on delete set null,
  nombre text,
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_fecha_idx on workouts (user_id, fecha);

create table if not exists sets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id bigint not null references workouts(id) on delete cascade,
  ejercicio_id text not null,
  fecha date not null default current_date,
  reps numeric not null,
  peso numeric not null default 0,
  rpe numeric,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists sets_workout_idx on sets (workout_id);
create index if not exists sets_user_fecha_idx on sets (user_id, fecha);
create index if not exists sets_user_ejercicio_idx on sets (user_id, ejercicio_id, created_at);

create table if not exists runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  distancia_km numeric not null,
  tiempo_seg integer not null,
  created_at timestamptz not null default now()
);
create index if not exists runs_user_fecha_idx on runs (user_id, fecha);

alter table routine_templates enable row level security;
alter table workouts enable row level security;
alter table sets enable row level security;
alter table runs enable row level security;

create policy "routine_templates: owner only" on routine_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts: owner only" on workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sets: owner only" on sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "runs: owner only" on runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
