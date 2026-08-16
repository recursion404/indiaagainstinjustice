alter table public.poll_options
add column if not exists vote_count integer not null default 0;

create policy "Citizens can read their own poll votes"
  on public.poll_votes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Citizens can update their poll vote"
  on public.poll_votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.increment_poll_option_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.poll_options
  set vote_count = vote_count + 1
  where id = new.option_id;

  return new;
end;
$$;

create or replace function public.adjust_poll_option_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.option_id <> new.option_id then
    update public.poll_options
    set vote_count = greatest(vote_count - 1, 0)
    where id = old.option_id;

    update public.poll_options
    set vote_count = vote_count + 1
    where id = new.option_id;
  end if;

  return new;
end;
$$;

create or replace function public.decrement_poll_option_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.poll_options
  set vote_count = greatest(vote_count - 1, 0)
  where id = old.option_id;

  return old;
end;
$$;

create trigger poll_votes_increment_option_count
  after insert on public.poll_votes
  for each row execute function public.increment_poll_option_vote_count();

create trigger poll_votes_adjust_option_count
  after update on public.poll_votes
  for each row execute function public.adjust_poll_option_vote_count();

create trigger poll_votes_decrement_option_count
  after delete on public.poll_votes
  for each row execute function public.decrement_poll_option_vote_count();

with inserted_poll as (
  insert into public.polls (question, slug, is_public)
  values (
    'What should Pune fix first to reduce traffic jams?',
    'pune-traffic-priority-first-fix',
    true
  )
  on conflict (slug) do update
  set question = excluded.question,
      is_public = excluded.is_public
  returning id
)
insert into public.poll_options (poll_id, label)
select inserted_poll.id, option_label
from inserted_poll
cross join (
  values
    ('Better signal timing'),
    ('Complete road work faster'),
    ('Remove illegal parking'),
    ('Improve PMPML priority')
) as options(option_label)
where not exists (
  select 1
  from public.poll_options
  where poll_options.poll_id = inserted_poll.id
    and poll_options.label = options.option_label
);
