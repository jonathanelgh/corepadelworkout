-- Allow Pro members to save AI coach multi-week training plans (not only single workouts).

drop policy if exists "Pro members insert own single workouts" on public.programs;
drop policy if exists "Pro members update own single workouts" on public.programs;
drop policy if exists "Pro members insert tracks for own single workouts" on public.program_location_tracks;
drop policy if exists "Pro members insert sessions for own single workouts" on public.program_sessions;
drop policy if exists "Pro members insert exercises for own single workouts" on public.program_exercises;

create policy "Pro members insert own coach programs"
  on public.programs for insert
  to authenticated
  with check (
    created_by_user_id = auth.uid()
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members update own coach programs"
  on public.programs for update
  to authenticated
  using (
    created_by_user_id = auth.uid()
    and public.user_has_active_pro(auth.uid())
  )
  with check (
    created_by_user_id = auth.uid()
  );

create policy "Pro members delete own coach programs"
  on public.programs for delete
  to authenticated
  using (
    created_by_user_id = auth.uid()
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members insert tracks for own coach programs"
  on public.program_location_tracks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.programs p
      where p.id = program_id
        and p.created_by_user_id = auth.uid()
    )
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members insert weeks for own coach programs"
  on public.program_weeks for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_location_tracks plt
      inner join public.programs p on p.id = plt.program_id
      where plt.id = track_id
        and p.created_by_user_id = auth.uid()
    )
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members insert sessions for own coach programs"
  on public.program_sessions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_location_tracks plt
      inner join public.programs p on p.id = plt.program_id
      where plt.id = track_id
        and p.created_by_user_id = auth.uid()
    )
    and public.user_has_active_pro(auth.uid())
  );

create policy "Pro members insert exercises for own coach programs"
  on public.program_exercises for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.program_sessions ps
      inner join public.program_location_tracks plt on plt.id = ps.track_id
      inner join public.programs p on p.id = plt.program_id
      where ps.id = session_id
        and p.created_by_user_id = auth.uid()
    )
    and public.user_has_active_pro(auth.uid())
  );
