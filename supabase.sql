-- ORBIT Tracker — Supabase schema
-- Safe to run on a fresh project and safe to re-run on an existing project.

create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  code text,
  category text not null default 'Other',
  color text default '#8b5cf6',
  icon text default 'book-open',
  target_hours numeric default 0,
  notes text default '',
  created_at timestamptz default now()
);

-- Existing ORBIT installs may still have the old GATE/Semester-only category check.
-- Remove it so custom categories work for every user.
alter table public.subjects drop constraint if exists subjects_category_check;
alter table public.subjects add column if not exists notes text default '';

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text,
  notes text default '',
  due_date date,
  start_time text,
  end_time text,
  priority text default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  status text default 'Todo' check (status in ('Todo','In Progress','Done')),
  estimated_minutes int default null,
  tags text[] default '{}',
  created_at timestamptz default now(),
  completed_at timestamptz,
  google_event_id text
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  minutes int not null,
  session_date date default current_date,
  note text default ''
);

alter table public.tasks alter column title drop not null;
alter table public.tasks add column if not exists google_event_id text;
alter table public.tasks add column if not exists start_time text;
alter table public.tasks add column if not exists end_time text;

alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.study_sessions enable row level security;

-- Re-runnable policies.
drop policy if exists "subjects own" on public.subjects;
drop policy if exists "tasks own" on public.tasks;
drop policy if exists "sessions own" on public.study_sessions;


create policy "subjects own" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions own" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Task scheduling range (safe to run on an existing project)
alter table public.tasks add column if not exists start_date date;
alter table public.tasks add column if not exists end_date date;
