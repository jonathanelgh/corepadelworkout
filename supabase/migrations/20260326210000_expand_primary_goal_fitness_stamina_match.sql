-- More onboarding primary_goal options: overall fitness, stamina, match play.

alter table public.profiles drop constraint if exists profiles_primary_goal_check;

alter table public.profiles
  add constraint profiles_primary_goal_check
  check (
    primary_goal is null
    or primary_goal in (
      'power',
      'speed',
      'longevity',
      'injury_recovery',
      'consistency',
      'technique',
      'overall_fitness',
      'stamina',
      'match_play'
    )
  );

comment on column public.profiles.primary_goal is 'Onboarding priority: power, speed, longevity, injury_recovery, consistency, technique, overall_fitness, stamina, match_play.';
