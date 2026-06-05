do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
    and tablename = 'profiles'
    and policyname = 'profiles self insert'
  ) then
    create policy "profiles self insert"
    on profiles for insert
    to authenticated
    with check (id = auth.uid());
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' = 'coach' then 'coach'::app_role
      else 'parent_player'::app_role
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
