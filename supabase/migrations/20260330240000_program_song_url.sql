-- Optional soundtrack URL for programs (e.g. MP3 in the programs storage bucket).

alter table public.programs
  add column if not exists song_url text;

comment on column public.programs.song_url is 'Optional URL to a program soundtrack (e.g. MP3 hosted in storage or external).';

-- Allow MP3 in the programs bucket (covers, video, and audio).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'programs',
  'programs',
  true,
  524288000,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3'
  ]::text[]
)
on conflict (id) do update set
  allowed_mime_types = excluded.allowed_mime_types;
