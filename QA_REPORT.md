# QA Report

Fecha: 2026-05-08
Rama: `qa/mvp-functional-review`

## Alcance revisado

- flujo publico completo: home, catalogo, filtros, detalle, carrito, checkout y WhatsApp
- flujo admin: login, dashboard, categorias, productos, imagenes, pedidos, configuracion y logout
- consistencia de datos, RLS y variables de entorno
- README y comportamiento sin Supabase / con mocks
- verificacion tecnica: `npm run build` y `npm run lint`

## Bugs criticos

No quedan bugs criticos abiertos despues de esta revision.

Hallazgos criticos simples corregidos en esta rama:

- checkout con Supabase permitia intentar generar pedidos con items ya no vendibles (`hidden`, `out_of_stock` o removidos del storefront) y recien fallaba al pegarle a la RPC. Se corrigio en `src/pages/public/CheckoutPage.tsx`.
- la UI permitia cantidades mayores a `99`, pero la RPC `create_order_with_items` las rechaza. Se alineo el limite en `src/store/cartStore.ts` y `src/pages/public/ProductDetailPage.tsx`.
- el checkout mostraba un mensaje tecnico hablando de la RPC si Supabase fallaba. Se reemplazo por un mensaje apto para cliente final en `src/pages/public/CheckoutPage.tsx`.

## Bugs menores

- productos asociados a una categoria inactiva siguen visibles en el storefront, pero pierden su categoria y quedan como `Catalogo` o sin filtro claro. Esto sale de la combinacion entre `src/hooks/useStorefrontData.tsx`, `src/components/product/ProductCard.tsx` y `src/pages/public/ProductDetailPage.tsx`.
- la home no tiene empty state explicito si el catalogo queda vacio: la seccion de destacados puede renderizar una grilla vacia sin contexto en `src/pages/public/HomePage.tsx`.
- el login admin convierte cualquier error de autenticacion en `Email o password invalidos.`. Si Supabase Auth estuviera caido o devolviera otro error, el mensaje seria enganoso en `src/pages/admin/AdminLoginPage.tsx`.

## Mejoras recomendadas

- reconciliar el carrito local con los datos actuales del storefront al abrir `/carrito` o `/checkout`, para refrescar precio y disponibilidad antes del resumen. Hoy el total sigue siendo estimado y el valor final correcto lo resuelve Supabase.
- reforzar `store_settings` como singleton real en base de datos. La app usa la primera fila por `created_at asc`, pero el modelo sigue permitiendo duplicados por escritura concurrente.
- hacer code splitting basico para bajar el warning de bundle grande que aparece en `vite build`.
- bajar un poco el tono interno/demo en textos como `Storefront v1` o algunas referencias demasiado tecnicas del panel.

## Cosas que NO conviene tocar todavia

- no sumar pagos online, Mercado Pago, Stripe ni webhooks
- no agregar usuarios compradores ni registro publico
- no convertir el carrito en stock transaccional
- no mover la logica a un backend propio solo para esta version
- no complejizar el modelo de pedidos mientras el cierre siga siendo manual por WhatsApp

## Seguridad y consistencia

- no se expone `SUPABASE_SERVICE_ROLE_KEY`; solo se usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- el `order_code` sigue formato `PED-YYMMDD-XXXXXX`
- el mensaje de WhatsApp usa items y total finales devueltos por Supabase cuando Supabase esta configurado
- `store_settings` se carga siempre por `created_at asc` y se toma la primera fila
- RLS sigue alineado con el alcance:
  - lectura publica de `categories`, `products`, `product_images` y `store_settings`
  - creacion publica de pedidos solo via RPC `create_order_with_items`
  - modificacion de catalogo, pedidos y configuracion solo para admin autenticado
- no encontre senales de pagos online ni textos como `compra aprobada` o `pago confirmado`

## Checklist manual de prueba

- abrir la tienda sin variables de entorno y confirmar que usa mocks locales
- abrir la tienda con Supabase configurado y sin `store_settings` para validar error visible y CTAs de WhatsApp ocultos
- navegar home, catalogo, filtros, busqueda y detalle desde mobile y desktop
- probar producto con imagen y producto sin imagen
- intentar agregar un producto `out_of_stock` y confirmar que no deja
- agregar productos, modificar cantidades, eliminar y vaciar carrito
- verificar que el carrito persiste al recargar
- generar un pedido con Supabase y confirmar:
  - codigo `PED-YYMMDD-XXXXXX`
  - draft unico por carrito
  - mensaje de WhatsApp con items y total finales de Supabase
- cambiar un producto a `hidden` o `out_of_stock` con el carrito ya armado y confirmar que checkout lo bloquea
- probar login admin con usuario valido y con usuario que no exista en `admin_users`
- revisar dashboard, categorias, productos, imagenes, pedidos y configuracion desde mobile
- crear la primera fila de `store_settings` desde `/admin/configuracion`
- cambiar un pedido a `cancelled` y `completed` y confirmar dialogo de confirmacion
- intentar eliminar un producto con pedidos asociados y confirmar que el panel lo explica con claridad

## Veredicto

Listo para demo guiada y para una entrega MVP controlada a cliente no tecnico.

No lo considero cerrado como entrega final sin seguimiento porque todavia quedan menores de consistencia:

- productos visibles con categoria inactiva
- home sin empty state si el catalogo queda vacio
- mensaje de login admin demasiado generico ante errores de Auth

## Verificacion ejecutada

- `npm run build` OK
- `npm run lint` OK
