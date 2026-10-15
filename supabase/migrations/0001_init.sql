-- TailorBook schema. Run once in Supabase SQL Editor (or `supabase db push`).
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text, address text,
  unit text not null default 'inches' check (unit in ('inches','cm')),
  logo_path text,
  created_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text, address text, notes text,
  created_at timestamptz not null default now()
);
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vals jsonb not null default '{}', notes text,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  measurement_id uuid references public.measurements(id) on delete set null,
  order_no integer not null,
  status text not null default 'New' check (status in ('New','Cutting','Stitching','Ready','Delivered','Cancelled')),
  order_date date not null default current_date,
  trial_date date, delivery_date date, notes text,
  created_at timestamptz not null default now(),
  unique (shop_id, order_no)
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  garment text not null, qty integer not null default 1 check (qty > 0),
  fabric text, price numeric(12,2) not null default 0 check (price >= 0), instructions text
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash', paid_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index on public.customers(shop_id);
create index on public.measurements(customer_id);
create index on public.orders(shop_id, status);
create index on public.orders(customer_id);
create index on public.order_items(order_id);
create index on public.payments(order_id);

-- Per-shop order numbers
create function public.set_order_no() returns trigger language plpgsql as $$
begin
  select coalesce(max(order_no),0)+1 into new.order_no from public.orders where shop_id = new.shop_id;
  return new;
end $$;
create trigger trg_order_no before insert on public.orders for each row execute function public.set_order_no();

-- Block payments larger than the remaining balance
create function public.check_payment() returns trigger language plpgsql as $$
declare tot numeric; paid numeric;
begin
  select coalesce(sum(qty*price),0) into tot from public.order_items where order_id = new.order_id;
  select coalesce(sum(amount),0) into paid from public.payments where order_id = new.order_id;
  if paid + new.amount > tot then raise exception 'Payment exceeds remaining balance'; end if;
  return new;
end $$;
create trigger trg_check_payment before insert on public.payments for each row execute function public.check_payment();

-- Row Level Security (tenant isolation)
create function public.my_shop_ids() returns setof uuid language sql security definer stable set search_path = public
as $$ select id from public.shops where owner_id = auth.uid() $$;

alter table public.shops enable row level security;
create policy shops_own on public.shops for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['customers','measurements','orders','order_items','payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (shop_id in (select public.my_shop_ids())) with check (shop_id in (select public.my_shop_ids()))', t||'_tenant', t);
  end loop;
end $$;
