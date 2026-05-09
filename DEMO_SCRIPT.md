# Demo Script

Guion simple para presentar UrbanCity a un cliente no tecnico.

## 1. Que problema resuelve

UrbanCity resuelve una necesidad concreta de comercios chicos: mostrar su catalogo online, permitir que el cliente arme un pedido y cerrar la coordinacion final por WhatsApp sin montar una tienda compleja con pagos online.

## 2. Como navega el cliente

1. El cliente entra a la home y entiende rapidamente que productos ofrece el comercio.
2. Desde catalogo puede filtrar por categoria o buscar por nombre.
3. Puede abrir el detalle de un producto para ver descripcion, precio, estado de disponibilidad e imagenes.

## 3. Como agrega productos al carrito

1. Desde la card o desde el detalle agrega productos.
2. El carrito queda guardado en el navegador.
3. Puede modificar cantidades, quitar productos o vaciar el carrito antes de confirmar.

## 4. Como genera el pedido

1. En checkout completa nombre, telefono y un mensaje opcional.
2. La app genera el pedido con estado pendiente de confirmacion.
3. Se muestra un resumen claro del pedido con codigo, items y total estimado o final segun corresponda.

## 5. Como se envia por WhatsApp

1. El cliente toca `Enviar pedido por WhatsApp`.
2. Se abre WhatsApp con el mensaje ya armado.
3. El comercio continua por ese canal para confirmar disponibilidad, retiro y pago manualmente.

Mensaje clave para remarcar:
- la web no cobra
- el pago se coordina por WhatsApp

## 6. Como el comercio lo gestiona desde admin

1. El comercio entra al panel admin con su usuario.
2. Desde pedidos puede ver el listado recibido.
3. Puede abrir el detalle, copiar el resumen, abrir WhatsApp del cliente y cambiar el estado:
   - pendiente
   - confirmado
   - listo para retirar
   - entregado/pagado manualmente
   - cancelado

## 7. Como cambia productos, precios y fotos

1. Desde productos crea o edita productos.
2. Puede cambiar nombre, descripcion, categoria, precio y disponibilidad.
3. Puede marcar destacados, ocultar productos y subir o reordenar imagenes.

## 8. Como cambia WhatsApp, Instagram, horarios y direccion

1. Desde `/admin/configuracion` actualiza:
   - nombre del comercio
   - telefono de WhatsApp
   - Instagram
   - direccion
   - horarios
   - mensaje de checkout
2. Esos cambios impactan en header, footer, contacto y checkout.

## 9. Que queda para una etapa 2

- pagos online
- reglas de envio
- facturacion
- clientes registrados
- stock mas avanzado
- reportes mas profundos
- automatizaciones comerciales

## 10. Cierre sugerido de la demo

La propuesta de valor en esta etapa es simple: vender mejor con un catalogo profesional y un flujo de pedidos ordenado, sin sumar complejidad operativa ni costo tecnico innecesario.
