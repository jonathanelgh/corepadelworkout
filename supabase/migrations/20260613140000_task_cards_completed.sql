-- Per-card completed flag (Trello-style checkbox), independent of column.

alter table public.task_cards
  add column if not exists completed boolean not null default false;

comment on column public.task_cards.completed is 'Marked done via checkbox; independent of board column.';

create index if not exists task_cards_completed_idx on public.task_cards (board_id, completed);
