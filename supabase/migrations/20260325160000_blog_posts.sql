-- Editorial blog: public reads published posts; admins manage.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  body text not null,
  cover_image_url text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_status_check check (status in ('draft', 'published'))
);

comment on table public.blog_posts is 'Marketing / member blog posts; body is plain text (paragraphs separated by blank lines).';

create unique index blog_posts_slug_key on public.blog_posts (slug);
create index blog_posts_published_idx on public.blog_posts (published_at desc)
  where status = 'published';

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row
  execute function public.set_row_updated_at();

alter table public.blog_posts enable row level security;

create policy "Published blog posts are readable"
  on public.blog_posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

create policy "Admins read all blog posts"
  on public.blog_posts
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert blog posts"
  on public.blog_posts
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update blog posts"
  on public.blog_posts
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete blog posts"
  on public.blog_posts
  for delete
  to authenticated
  using (public.is_admin());

insert into public.blog_posts (slug, title, excerpt, body, status, published_at)
values
  (
    'why-padel-needs-strength',
    'Why padel needs more than court time',
    'Strength and mobility work keeps you injury-free and adds power to your game.',
    'Padel is addictive — and repetitive. Shoulders, elbows, and hips take a beating when you only play matches.

Structured off-court work builds the resilience and explosiveness that transfer directly to the glass and the smash.

Start with two short sessions a week; consistency beats intensity.',
    'published',
    now() - interval '2 days'
  ),
  (
    'warm-up-before-you-play',
    'A 10-minute warm-up before you play',
    'Prime your nervous system and joints so the first rally does not cost you the next day.',
    'Arrive a few minutes early. Think rhythm and range of motion, not static stretching.

Light jogging or skipping, arm circles, hip openers, and a few split-steps wake everything up.

Finish with short accelerations so your first sprint on court is not a shock.',
    'published',
    now() - interval '5 days'
  ),
  (
    'recovery-after-matches',
    'Recovery habits that actually work',
    'Sleep, hydration, and easy movement beat gadgets for most club players.',
    'Match night is not the time to test your limits in the gym. Keep the next day easy: walk, swim, or a light bike.

Prioritise sleep — it is when tissue adapts. Hydrate with electrolytes if you sweated heavily.

A few minutes of breathing and light stretching before bed can improve how you feel in the morning.',
    'published',
    now() - interval '9 days'
  )
on conflict (slug) do nothing;
