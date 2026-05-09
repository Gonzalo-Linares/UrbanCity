# UrbanCity

UrbanCity es una tienda web simple para un comercio chico que vende por catalogo, carrito y coordinacion final por WhatsApp. Esta base no procesa pagos online, no crea usuarios compradores y no usa backend propio.

## Estado actual

- Storefront publico implementado con datos mock locales.
- Catalogo con categorias, buscador y detalle de producto.
- Carrito persistente con Zustand y `localStorage`.
- Checkout simple sin backend que genera un codigo local `PED-YYMMDD-XXXXXX`.
- La UI usa mocks solo cuando `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no estan configuradas.
- Si Supabase esta configurado, la UI lee `categories`, `products`, `product_images` y `store_settings` desde Supabase.
- Si falta una fila valida en `store_settings`, la app muestra error y oculta las acciones de WhatsApp.
- Login admin real implementado con Supabase Auth y validacion contra `public.admin_users`.
- Layout admin responsive implementado con sidebar, header y conteos basicos.
- CRUD de categorias y productos implementado desde el panel admin.
- Configuracion del comercio editable desde `/admin/configuracion`.
- Subida de imagenes de productos implementada con Supabase Storage en el bucket `product-images`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Zustand
- React Hook Form + Zod
- Supabase JS

## Instalacion

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Estructura relevante

```text
src/
  components/
    ui/
    layout/
    product/
    cart/
  data/
    mockProducts.ts
  hooks/
  lib/
    supabase.ts
    whatsapp.ts
    formatters.ts
    slugs.ts
  pages/
    public/
  routes/
  schemas/
  store/
    cartStore.ts
  types/
    database.ts
```

## Datos mock

La parte publica usa datos locales definidos en [src/data/mockProducts.ts](src/data/mockProducts.ts) solo cuando Supabase no esta configurado.

Eso cubre:

- home
- catalogo
- categorias
- buscador simple
- cards de producto
- detalle de producto
- header y footer
- boton visible de WhatsApp
- link visible de Instagram

## Carrito

El carrito usa Zustand con persistencia en `localStorage`.

Soporta:

- agregar producto
- quitar producto
- modificar cantidad
- vaciar carrito
- calcular total
- mantener el estado al recargar

## Checkout

El checkout funciona sin backend propio, pero si Supabase esta configurado puede persistir el pedido usando la RPC `create_order_with_items`.

Hace esto:

- pide nombre
- pide telefono
- acepta mensaje opcional
- genera un codigo local `PED-YYMMDD-XXXXXX`
- arma un resumen
- genera un mensaje de WhatsApp
- abre `wa.me` con el mensaje precargado

Si Supabase esta configurado:

- guarda el pedido con la RPC `create_order_with_items`
- usa el total final y los items finales devueltos por Supabase para reconstruir el mensaje de WhatsApp
- bloquea la generacion duplicada mientras exista un draft valido para el carrito actual

Formato de `order_code`:

- prefijo `PED`
- fecha local en formato `YYMMDD`
- sufijo aleatorio de 6 digitos generado con `crypto.getRandomValues`

Ejemplo:

- `PED-260508-381204`

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No agregues `SUPABASE_SERVICE_ROLE_KEY` en frontend.

## Preparacion de Supabase

La integracion base ya existe en [src/lib/supabase.ts](src/lib/supabase.ts) y en los tipos de [src/types/database.ts](src/types/database.ts).

Para preparar el proyecto en Supabase:

1. Crear un proyecto nuevo en Supabase.
2. Abrir el SQL Editor.
3. Ejecutar [supabase/schema.sql](supabase/schema.sql).
4. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`.
5. Ingresar al panel admin y crear la primera configuracion desde `/admin/configuracion`.

Sin una fila valida en `store_settings`, el storefront no usa telefono demo: muestra error y deshabilita las acciones de WhatsApp.
La app espera una unica fila en `store_settings` y siempre usa la primera segun `created_at asc`.

El schema crea estas tablas:

- `categories`
- `products`
- `product_images`
- `orders`
- `order_items`
- `store_settings`

Tambien crea la RPC:

- `create_order_with_items`

La RPC `create_order_with_items` devuelve:

- `order_id`
- `order_code`
- `total`
- `product_id`
- `product_name`
- `unit_price`
- `quantity`
- `subtotal`

Y agrega esta tabla para acceso admin:

- `admin_users`

La tabla `admin_users` tiene RLS habilitado para que cada usuario autenticado solo pueda leer su propia fila y confirmar si esta activo como admin.

Ademas, el schema ahora:

- habilita RLS en `categories`, `products`, `product_images`, `orders`, `order_items` y `store_settings`
- agrega politicas de lectura publica para storefront y politicas de gestion para admin autenticado
- crea la funcion `is_active_admin()` para reutilizar el chequeo de permisos en politicas
- crea y configura el bucket publico `product-images` con limite de 5 MB y tipos `JPG`, `PNG`, `WEBP`, `AVIF`
- agrega policies sobre `storage.objects` para lectura publica y gestion admin del bucket de imagenes

El CRUD de productos no permite eliminacion fisica cuando existen pedidos asociados; el bloqueo queda respaldado por la relacion con `order_items`.
El panel admin de productos permite subir imagenes, guardar su URL publica en `product_images`, reordenarlas y eliminarlas.

## Configuracion del comercio

La configuracion comercial ya se edita desde `/admin/configuracion`.

Desde esa pantalla puedes crear o actualizar:

- `store_name`
- `whatsapp_phone`
- `instagram_url`
- `address`
- `opening_hours`
- `checkout_message`

Notas importantes:

- ya no hace falta modificar Supabase manualmente para cambiar WhatsApp, Instagram, direccion, horarios o el mensaje de checkout
- el formulario hace `insert` si no existe ninguna fila y `update` sobre la primera fila existente si ya hay configuracion
- el storefront, el header, el footer, la pagina de contacto y el checkout consumen estos datos
- `store_settings` sigue con lectura publica y escritura solo para admin autenticado por RLS

## Primer admin

1. Crea el usuario en Supabase Auth con email y password.
2. Busca el `id` del usuario creado en `auth.users`.
3. Inserta una fila en `public.admin_users`:

```sql
insert into public.admin_users (user_id, is_active)
values ('<auth-user-uuid>', true);
```

Con eso el usuario ya puede entrar en `/admin/login`.

## Deploy en Cloudflare Pages

Configuracion recomendada:

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

El archivo [public/_redirects](public/_redirects) deja lista la app para SPA routing.

## Proximo paso recomendado

El siguiente paso sano es pulir los flujos admin restantes y reforzar detalles operativos, manteniendo la logica de checkout sin pagos online ni usuarios compradores.
