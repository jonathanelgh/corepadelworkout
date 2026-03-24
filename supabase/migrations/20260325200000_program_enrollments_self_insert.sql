-- Allow authenticated users to create their own active enrollment for published programs (pre-payment / dev flow).

create policy "Users enroll in published programs"
  on public.program_enrollments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.programs p
      where p.id = program_enrollments.program_id
        and p.status = 'published'
    )
  );
