import type { Availability, OrderStatus } from '@/types/database'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatAvailabilityLabel(availability: Availability) {
  switch (availability) {
    case 'available':
      return 'Disponible'
    case 'inquiry':
      return 'Consultar disponibilidad'
    case 'out_of_stock':
      return 'Sin stock'
    case 'hidden':
      return 'Oculto'
    default:
      return 'Disponible'
  }
}

export function formatOrderStatus(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'confirmed':
      return 'Confirmado'
    case 'ready_for_pickup':
      return 'Listo para retirar'
    case 'completed':
      return 'Entregado / Pagado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Pendiente'
  }
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}
