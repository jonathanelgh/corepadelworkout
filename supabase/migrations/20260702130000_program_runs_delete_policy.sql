-- Allow members to leave / cancel an active program (delete own run and session log).

create policy "Users delete own program runs"
  on public.program_runs for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own session completions"
  on public.program_session_completions for delete to authenticated
  using (auth.uid() = user_id);
