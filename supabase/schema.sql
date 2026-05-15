create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active = true
  );
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  availability text not null default 'available'
    check (availability in ('available', 'inquiry', 'out_of_stock', 'hidden')),
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.products
add column if not exists compare_at_price numeric(12,2);

alter table public.products
add column if not exists installment_price numeric(12,2);

alter table public.products
drop constraint if exists products_compare_at_price_non_negative;

alter table public.products
add constraint products_compare_at_price_non_negative
check (compare_at_price is null or compare_at_price >= 0);

alter table public.products
drop constraint if exists products_installment_price_non_negative;

alter table public.products
add constraint products_installment_price_non_negative
check (installment_price is null or installment_price >= 0);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(product_id, size_label)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_message text,
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled')),
  whatsapp_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  size_label text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  whatsapp_phone text not null,
  instagram_url text,
  address text,
  opening_hours text,
  checkout_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.home_hero_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default '',
  title text not null,
  subtitle text,
  description text,
  image_url text not null,
  image_alt text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.order_items
add column if not exists size_label text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_admin_users_user_id on public.admin_users(user_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_sizes_product_id on public.product_sizes(product_id);
create index if not exists idx_product_sizes_product_sort on public.product_sizes(product_id, sort_order);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_home_hero_slides_sort_order on public.home_hero_slides(sort_order);

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.home_hero_slides enable row level security;

grant execute on function public.is_active_admin() to anon, authenticated;

drop policy if exists admin_users_select_own on public.admin_users;
create policy admin_users_select_own
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists categories_admin_manage on public.categories;
create policy categories_admin_manage
on public.categories
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (is_active = true and availability <> 'hidden');

drop policy if exists products_admin_manage on public.products;
create policy products_admin_manage
on public.products
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and products.availability <> 'hidden'
  )
);

drop policy if exists product_images_admin_manage on public.product_images;
create policy product_images_admin_manage
on public.product_images
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists product_sizes_public_read on public.product_sizes;
create policy product_sizes_public_read
on public.product_sizes
for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1
    from public.products
    where products.id = product_sizes.product_id
      and products.is_active = true
      and products.availability <> 'hidden'
  )
);

drop policy if exists product_sizes_admin_manage on public.product_sizes;
create policy product_sizes_admin_manage
on public.product_sizes
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists product_images_bucket_public_read on storage.objects;
create policy product_images_bucket_public_read
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists product_images_bucket_admin_manage on storage.objects;
create policy product_images_bucket_admin_manage
on storage.objects
for all
to authenticated
using (bucket_id = 'product-images' and public.is_active_admin())
with check (bucket_id = 'product-images' and public.is_active_admin());

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists store_settings_admin_manage on public.store_settings;
create policy store_settings_admin_manage
on public.store_settings
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists home_hero_slides_public_read on public.home_hero_slides;
create policy home_hero_slides_public_read
on public.home_hero_slides
for select
to anon, authenticated
using (is_active = true);

drop policy if exists home_hero_slides_admin_manage on public.home_hero_slides;
create policy home_hero_slides_admin_manage
on public.home_hero_slides
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists orders_admin_manage on public.orders;
create policy orders_admin_manage
on public.orders
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists order_items_admin_manage on public.order_items;
create policy order_items_admin_manage
on public.order_items
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_sizes_updated_at on public.product_sizes;
create trigger trg_product_sizes_updated_at
before update on public.product_sizes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
before update on public.store_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_home_hero_slides_updated_at on public.home_hero_slides;
create trigger trg_home_hero_slides_updated_at
before update on public.home_hero_slides
for each row
execute function public.set_updated_at();

drop function if exists public.create_order_with_items(text, text, text, text, jsonb);

create or replace function public.create_order_with_items(
  p_order_code text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_message text default null,
  p_items jsonb default '[]'::jsonb
)
returns table (
  order_id uuid,
  order_code text,
  total numeric,
  product_id uuid,
  product_name text,
  size_label text,
  unit_price numeric,
  quantity integer,
  subtotal numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_size_label text;
  v_subtotal numeric(12,2);
begin
  p_order_code := trim(coalesce(p_order_code, ''));
  p_customer_name := trim(coalesce(p_customer_name, ''));
  p_customer_phone := trim(coalesce(p_customer_phone, ''));
  p_customer_message := nullif(trim(coalesce(p_customer_message, '')), '');

  if length(p_order_code) < 8 then
    raise exception 'Codigo de pedido invalido.';
  end if;

  if length(p_customer_name) < 2 then
    raise exception 'Nombre invalido.';
  end if;

  if length(p_customer_phone) < 8 then
    raise exception 'Telefono invalido.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe incluir al menos un item.';
  end if;

  insert into public.orders (
    id,
    order_code,
    customer_name,
    customer_phone,
    customer_message,
    total,
    status
  )
  values (
    v_order_id,
    p_order_code,
    p_customer_name,
    p_customer_phone,
    p_customer_message,
    0,
    'pending'
  );

  for v_item in
    select value
    from jsonb_array_elements(p_items) as value
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_size_label := nullif(trim(coalesce(v_item ->> 'size_label', '')), '');

    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Cantidad invalida en el pedido.';
    end if;

    select *
    into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and is_active = true
      and availability in ('available', 'inquiry');

    if not found then
      raise exception 'Uno de los productos no esta disponible para la venta.';
    end if;

    if exists (
      select 1
      from public.product_sizes
      where product_id = v_product.id
        and is_available = true
    ) then
      if v_size_label is null then
        raise exception 'Selecciona un talle para este producto.';
      end if;

      if not exists (
        select 1
        from public.product_sizes
        where product_id = v_product.id
          and is_available = true
          and size_label = v_size_label
      ) then
        raise exception 'Selecciona un talle disponible para este producto.';
      end if;
    end if;

    v_subtotal := round((v_product.price * v_quantity)::numeric, 2);
    v_total := round((v_total + v_subtotal)::numeric, 2);

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      size_label,
      unit_price,
      quantity,
      subtotal
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_size_label,
      v_product.price,
      v_quantity,
      v_subtotal
    );
  end loop;

  update public.orders
  set total = v_total
  where id = v_order_id;

  return query
  select
    v_order_id,
    p_order_code,
    v_total,
    order_items.product_id,
    order_items.product_name,
    order_items.size_label,
    order_items.unit_price,
    order_items.quantity,
    order_items.subtotal
  from public.order_items
  where order_items.order_id = v_order_id
  order by order_items.created_at, order_items.id;
exception
  when unique_violation then
    raise exception 'El codigo de pedido ya existe. Reintenta la operacion.';
end;
$$;

grant execute on function public.create_order_with_items(text, text, text, text, jsonb)
to anon, authenticated;
