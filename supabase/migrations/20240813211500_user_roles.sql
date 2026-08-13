-- Create role enum if it doesn't exist
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'user');
  end if;
end $$;

-- Create user_roles table
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null default 'admin',
    unique (user_id, role)
);

-- Grant access
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policy: authenticated users can see roles
create policy "Authenticated users can view roles"
on public.user_roles for select
to authenticated
using (true);

-- Assign admin role to the owner
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ammarhassan1888@gmail.com'
on conflict do nothing;
