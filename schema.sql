-- GIFTS-POWERS schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  brand_name text not null default 'GIFTS-POWERS 礼蕴力量',
  hero_title text not null default '全景可交互 3D 营销礼品定制工作室',
  hero_subtitle text not null default '拖拽旋转模型查看细节，实时调换材质颜色与印花 LOGO，支持起订量阶梯自动询价',
  contact_email text not null default '',
  contact_phone text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  title text not null,
  spec text not null,
  base_price numeric(10,2) not null default 38.50 check (base_price >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  company text default '',
  message text default '',
  product_id text default '',
  product_title text default '',
  quantity int not null default 500 check (quantity > 0),
  craft text default '',
  estimated_unit_price numeric(10,2),
  estimated_total numeric(12,2),
  status text not null default 'new' check (status in ('new','contacted','quoted','closed')),
  admin_note text default '',
  created_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;
insert into public.products (id,title,spec,base_price,sort_order) values
 ('bottle','高级双层保温杯','SPEC: 304 STAINLESS STEEL / 500ML',38.50,1),
 ('mug','高透质感马克杯','SPEC: PREMIUM CERAMIC / 350ML',26.00,2),
 ('coin','定制金属纪念币','SPEC: ZINC ALLOY / 50MM',12.80,3)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.inquiries enable row level security;

-- Public site can read public-facing configuration and active product data.
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select to anon, authenticated using (active = true);

-- Anonymous visitors can submit an inquiry, but cannot read or change inquiries.
drop policy if exists "public submit inquiries" on public.inquiries;
create policy "public submit inquiries" on public.inquiries for insert to anon, authenticated
with check (
  length(trim(customer_name)) between 1 and 100 and
  length(trim(phone)) between 3 and 50 and
  quantity between 1 and 1000000 and
  length(coalesce(message,'')) <= 3000 and
  length(coalesce(company,'')) <= 200
);

-- Authenticated admins can manage settings, products and inquiries.
-- This assumes accounts are created/invited only by the project owner.
drop policy if exists "authenticated manage settings" on public.site_settings;
create policy "authenticated manage settings" on public.site_settings for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "authenticated manage products" on public.products;
create policy "authenticated manage products" on public.products for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "authenticated manage inquiries" on public.inquiries;
create policy "authenticated manage inquiries" on public.inquiries for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
