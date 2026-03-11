insert into public.students (first_name, level)
values
  ('Ava', 4),
  ('Noah', 4),
  ('Mia', 4),
  ('Liam', 4),
  ('Ella', 4),
  ('Lucas', 4),
  ('Zoe', 4)
on conflict do nothing;

insert into public.history_days (day_key)
values (current_date)
on conflict do nothing;
