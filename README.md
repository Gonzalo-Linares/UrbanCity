# UrbanCity

UrbanCity es una tienda web simple para un comercio chico que vende por catalogo, carrito y coordinacion final por WhatsApp. Esta base no procesa pagos online, no crea usuarios compradores y no usa backend propio.

## Estado actual

- Storefront publico implementado con datos mock locales.
- Catalogo con categorias, buscador y detalle de producto.
- Carrito persistente con Zustand y `localStorage`.
- Checkout simple sin backend que genera un codigo local `PED-YYMMDD-XXXXXX`.
- Los productos pueden tener `compare_at_price` opcional para mostrar ofertas visuales.
- La UI usa mocks solo cuando `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no estan configuradas.
- Si Supabase esta configurado, la UI lee `categories`, `products`, `product_images` y `store_settings` desde Supabase.
- Si falta una fila valida en `store_settings`, la app muestra error y oculta las acciones de WhatsApp.
- Login admin real implementado con Supabase Auth y validacion contra `public.admin_users`.
- Layout admin responsive implementado con sidebar, header y conteos basicos.
- CRUD de categorias y productos implementado desde el panel admin.
- Panel admin de pedidos con filtros, resumen copiable, acceso directo a WhatsApp y confirmacion antes de cancelar o marcar como entregado/pagado manualmente.
- Configuracion del comercio editable desde `/admin/configuracion`.
- Subida de imagenes de productos implementada con Supabase Storage en el bucket `product-images`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Zustand
- React Hook Form + Zod
- Supabase JS


## Carrito

El carrito usa Zustand con persistencia en `localStorage`.

Soporta:

- agregar producto
- quitar producto
- modificar cantidad
- vaciar carrito
- calcular total
- mantener el estado al recargar

