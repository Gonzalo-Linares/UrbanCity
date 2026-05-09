import { formatCurrency } from '@/lib/formatters'
import type { CartItem } from '@/types/store'

interface BuildMessageInput {
  orderCode: string
  storeName: string
  customerName: string
  customerPhone: string
  customerMessage: string
  checkoutMessage: string | null
  items: CartItem[]
  total: number
}

export function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function generateOrderCode() {
  const randomBuffer = new Uint16Array(1)
  globalThis.crypto.getRandomValues(randomBuffer)
  const randomPart = String((randomBuffer.at(0) ?? 0) % 10000).padStart(4, '0')
  return `PED-${randomPart}`
}

export function buildWhatsAppMessage({
  orderCode,
  storeName,
  customerName,
  customerPhone,
  customerMessage,
  checkoutMessage,
  items,
  total,
}: BuildMessageInput) {
  const lines = [
    `Hola, quiero confirmar un pedido de ${storeName}.`,
    '',
    `Codigo: ${orderCode}`,
    `Cliente: ${customerName}`,
    `Telefono: ${customerPhone}`,
    '',
    'Detalle del pedido:',
    ...items.map(
      (item) =>
        `- ${item.name} x${item.quantity} | ${formatCurrency(item.price * item.quantity)}`,
    ),
    '',
    `Total del pedido: ${formatCurrency(total)}`,
    'Estado inicial: pendiente de confirmacion',
  ]

  if (customerMessage.trim()) {
    lines.push(`Mensaje del cliente: ${customerMessage.trim()}`)
  }

  if (checkoutMessage?.trim()) {
    lines.push('', checkoutMessage.trim())
  }

  lines.push('', 'El pago se coordina manualmente con el comercio.')

  return lines.join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const cleanPhone = normalizeWhatsAppPhone(phone)
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
