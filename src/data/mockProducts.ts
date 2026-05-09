import type {
  CategoryRow,
  ProductImageRow,
  ProductRow,
  StoreSettingsRow,
} from '@/types/database'

const createdAt = '2026-05-08T00:00:00.000Z'

const categoryIds = {
  gifts: '1aabf95e-f18d-418a-aedb-d44f6d04f001',
  home: '1aabf95e-f18d-418a-aedb-d44f6d04f002',
  desk: '1aabf95e-f18d-418a-aedb-d44f6d04f003',
}

export const mockStoreSettings: StoreSettingsRow = {
  id: 'ce8a2b1f-74df-43ef-95d4-8f4d50ac1110',
  store_name: 'UrbanCity Atelier',
  whatsapp_phone: '5491123456789',
  instagram_url: 'https://instagram.com/urbancity.atelier',
  address: 'Peatonal San Juan',
  opening_hours: 'Lunes a sabados de 10:00 a 19:30',
  checkout_message:
    'La disponibilidad final y el pago se coordinan por WhatsApp.',
  created_at: createdAt,
  updated_at: createdAt,
}

export const mockCategories: CategoryRow[] = [
  {
    id: categoryIds.gifts,
    name: 'Regalos',
    slug: 'regalos',
    description: 'Selecciones simples para regalos y compras rapidas.',
    is_active: true,
    created_at: createdAt,
  },
  {
    id: categoryIds.home,
    name: 'Hogar',
    slug: 'hogar',
    description: 'Objetos calidos para sumar presencia a espacios cotidianos.',
    is_active: true,
    created_at: createdAt,
  },
  {
    id: categoryIds.desk,
    name: 'Escritorio',
    slug: 'escritorio',
    description: 'Piezas funcionales con terminacion prolija.',
    is_active: true,
    created_at: createdAt,
  },
]

export const mockProducts: ProductRow[] = [
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d001',
    category_id: categoryIds.gifts,
    name: 'Box Ritual Ambar',
    slug: 'box-ritual-ambar',
    description:
      'Set con vela mineral, difusor y tarjeta. Pensado para regalos simples con buena presencia.',
    price: 48900,
    availability: 'available',
    is_active: true,
    featured: true,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d002',
    category_id: categoryIds.home,
    name: 'Difusor Cedro Nocturno',
    slug: 'difusor-cedro-nocturno',
    description:
      'Fragancia amaderada de perfil sobrio. Ideal para living, recepcion o escritorio.',
    price: 23500,
    availability: 'available',
    is_active: true,
    featured: true,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d003',
    category_id: categoryIds.desk,
    name: 'Cuaderno Grain A5',
    slug: 'cuaderno-grain-a5',
    description:
      'Cuaderno de tapa texturada y hojas lisas. Una opcion prolija para notas y regalos.',
    price: 12800,
    availability: 'available',
    is_active: true,
    featured: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d004',
    category_id: categoryIds.home,
    name: 'Bandeja Piedra Mate',
    slug: 'bandeja-piedra-mate',
    description:
      'Bandeja liviana en tono piedra. Resuelve exhibicion y orden sin perder presencia visual.',
    price: 31900,
    availability: 'inquiry',
    is_active: true,
    featured: true,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d005',
    category_id: categoryIds.gifts,
    name: 'Taza Ceramica Arena',
    slug: 'taza-ceramica-arena',
    description:
      'Pieza de terminacion mate para desayuno, oficina o combos de regalo.',
    price: 15900,
    availability: 'available',
    is_active: true,
    featured: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: '5c77f34a-cbc0-48fd-b57e-6b61f2a0d006',
    category_id: categoryIds.desk,
    name: 'Lapicero Forma 02',
    slug: 'lapicero-forma-02',
    description:
      'Accesorio compacto para escritorio. Terminacion sobria y facil de combinar.',
    price: 11900,
    availability: 'out_of_stock',
    is_active: true,
    featured: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
]

export const mockProductImages: ProductImageRow[] = []
