alter table public.lesson_scrims
  add column if not exists narration jsonb;

alter table public.user_scrims
  add column if not exists narration jsonb;
