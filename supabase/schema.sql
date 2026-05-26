create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('customer', 'vendor')),
  preferred_locale text not null default 'en-EG',
  currency_code text not null default 'EGP',
  theme_preference text not null default 'system',
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  price numeric(10,2) not null,
  currency_code text not null default 'EGP',
  image_url text not null,
  image_path text,
  barcode text unique not null,
  stock integer not null default 0,
  featured boolean not null default false,
  vendor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text not null
);

create table if not exists public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  items jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'packing', 'shipped', 'delivered')),
  total_amount numeric(10,2) not null,
  currency_code text not null default 'EGP',
  shipping_address text not null,
  payment_last4 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'promo',
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role, preferred_locale, currency_code, theme_preference)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New Shopper'),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    'en-EG',
    'EGP',
    'system'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are viewable by authenticated users"
on public.profiles for select to authenticated using (true);

create policy "users manage own profile"
on public.profiles for update to authenticated using (auth.uid() = id);

create policy "products are public readable"
on public.products for select to authenticated using (true);

create policy "vendors can insert products"
on public.products for insert to authenticated with check (auth.uid() = vendor_id);

create policy "vendors can update own products"
on public.products for update to authenticated using (auth.uid() = vendor_id);

create policy "stores are public readable"
on public.stores for select to authenticated using (true);

create policy "users manage own wishlist"
on public.wishlists for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own orders"
on public.orders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own notifications"
on public.notifications for select to authenticated using (auth.uid() = user_id);

create policy "system inserts notifications"
on public.notifications for insert to authenticated with check (auth.uid() = user_id);

insert into public.stores (name, address, latitude, longitude, phone)
values
  ('Layal''s shop Downtown', '26 Talaat Harb St, Cairo', 30.0478, 31.2385, '+20 1001 460 250'),
  ('Layal''s shop Nasr City', 'Makram Ebeid, Nasr City', 30.0608, 31.3306, '+20 1001 643 076'),
  ('Layal''s shop Giza', 'Al Haram, Giza', 29.9927, 31.2118, '+20 1001 777 903')
on conflict do nothing;
