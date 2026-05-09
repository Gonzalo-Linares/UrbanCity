# Deployment Checklist

Guia paso a paso para dejar UrbanCity listo para demo real con Supabase y Cloudflare Pages.

## 1. Supabase

1. Crear un proyecto nuevo en Supabase.
2. Abrir `SQL Editor`.
3. Ejecutar completo `supabase/schema.sql`.
4. Verificar que el schema haya creado:
   - tablas de catalogo, pedidos y configuracion
   - tabla `public.admin_users`
   - bucket `product-images`
   - politicas RLS
5. Crear un usuario admin en `Authentication > Users`.
6. Copiar el `id` de `auth.users` para ese usuario.
7. Insertar el admin en `public.admin_users`:

```sql
insert into public.admin_users (user_id, is_active)
values ('<auth-user-uuid>', true);
```

8. Confirmar que `product-images` exista y quede usable para el panel admin.
9. Confirmar que RLS siga activo en las tablas del schema.
10. Entrar al panel admin y crear o editar `store_settings` desde `/admin/configuracion`.

Nota:
- no editar `store_settings` manualmente salvo emergencia
- la app espera una unica configuracion operativa y usa siempre la primera fila por `created_at asc`

## 2. Variables de entorno

Configurar estas variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Regla critica:
- `SUPABASE_SERVICE_ROLE_KEY` no debe ir nunca en frontend ni en Cloudflare Pages

## 3. Cloudflare Pages

1. Conectar el repo de GitHub.
2. Seleccionar la rama `main`.
3. Elegir `Framework preset: Vite`.
4. Configurar:
   - `Build command`: `npm run build`
   - `Output directory`: `dist`
5. Agregar variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Lanzar el deploy.
7. Verificar que el archivo `public/_redirects` mantenga el routing SPA:

```text
/* /index.html 200
```

8. Probar rutas directas en el deploy:
   - `/admin/login`
   - `/catalogo`
   - `/carrito`

## 4. Prueba funcional post-deploy

1. Abrir home.
2. Abrir catalogo.
3. Entrar al admin y crear la configuracion del comercio.
4. Crear una categoria.
5. Crear un producto.
6. Subir una imagen al producto.
7. Volver al storefront y generar un pedido desde checkout.
8. Abrir WhatsApp desde el boton del pedido.
9. Verificar el pedido en admin.
10. Cambiar el estado del pedido.
11. Probar el flujo completo en mobile.

## 5. Checklist de demo para cliente

- mostrar catalogo
- mostrar carrito
- mostrar checkout
- mostrar envio del pedido por WhatsApp
- mostrar panel admin
- mostrar edicion de productos
- mostrar pedidos
- mostrar configuracion del comercio

## 6. Que NO incluye esta version

- pagos online
- Mercado Pago
- Stripe
- envios
- facturacion
- usuarios compradores
- stock transaccional
- automatizacion de cobros

## 7. Recomendacion operativa

Antes de la demo, cargar al menos:
- 1 categoria activa
- 2 o 3 productos con imagen
- 1 configuracion de comercio valida en `/admin/configuracion`

Eso evita mostrar empty states durante la presentacion.
