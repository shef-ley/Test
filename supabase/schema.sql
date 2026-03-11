create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) > 0),
  level integer not null default 4 check (level between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.history_days (
  day_key date primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.history_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid,
  student_first_name text not null,
  previous_level integer,
  new_level integer,
  action_type text not null,
  note text,
  day_key date not null references public.history_days(day_key) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists students_updated_at on public.students;
create trigger students_updated_at
before update on public.students
for each row execute function public.handle_updated_at();

alter table public.students enable row level security;
alter table public.history_logs enable row level security;
alter table public.history_days enable row level security;

-- Teacher users must be authenticated for teacher dashboard/history endpoints.
create policy "authenticated can read students" on public.students for select to authenticated using (true);
create policy "authenticated can write students" on public.students for all to authenticated using (true) with check (true);

-- Student display uses anon key to read roster/levels only.
create policy "anon can read students" on public.students for select to anon using (true);

create policy "authenticated can manage history_logs" on public.history_logs for all to authenticated using (true) with check (true);
create policy "authenticated can manage history_days" on public.history_days for all to authenticated using (true) with check (true);
