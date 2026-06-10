-- Ensure every board has a "Completed" column (rename legacy "Done" or add at end).

update public.task_board_columns
set name = 'Completed'
where name = 'Done';

insert into public.task_board_columns (board_id, name, sort_order)
select b.id, 'Completed', coalesce(max_col.max_sort, -1) + 1
from public.task_boards b
left join lateral (
  select max(c.sort_order) as max_sort
  from public.task_board_columns c
  where c.board_id = b.id
) max_col on true
where not exists (
  select 1
  from public.task_board_columns cc
  where cc.board_id = b.id
    and lower(trim(cc.name)) = 'completed'
);
