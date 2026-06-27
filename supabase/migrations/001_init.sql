-- 妞妞太郎聊天室：Supabase 資料表
-- 在 Supabase Dashboard → SQL Editor 貼上執行

-- Telegram 使用者
create table if not exists public.users (
  id            bigint primary key,          -- Telegram user id
  first_name    text,
  last_name     text,
  username      text,
  photo_url     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 聊天訊息
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       bigint not null references public.users(id) on delete cascade,
  sender        text not null check (sender in ('user', 'bot')),
  text          text,
  image_url     text,
  created_at    timestamptz default now()
);

create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at desc);

-- Row Level Security（後端用 service_role key 存取，前端不直連）
alter table public.users enable row level security;
alter table public.messages enable row level security;

-- 可選：Supabase Storage bucket 存照片
-- Dashboard → Storage → New bucket → 名稱 "chat-images"，設為 private
-- 後端上傳後把 public URL 寫入 messages.image_url
