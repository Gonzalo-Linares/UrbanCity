export type Availability = 'available' | 'inquiry' | 'out_of_stock' | 'hidden'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          user_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          description: string | null
          price: number
          installment_price: number | null
          compare_at_price: number | null
          availability: Availability
          is_active: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          price: number
          installment_price?: number | null
          compare_at_price?: number | null
          availability?: Availability
          is_active?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          price?: number
          installment_price?: number | null
          compare_at_price?: number | null
          availability?: Availability
          is_active?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      product_sizes: {
        Row: {
          id: string
          product_id: string
          size_label: string
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          size_label: string
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          size_label?: string
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_code: string
          customer_name: string
          customer_phone: string
          customer_message: string | null
          total: number
          status: OrderStatus
          whatsapp_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_code: string
          customer_name: string
          customer_phone: string
          customer_message?: string | null
          total: number
          status?: OrderStatus
          whatsapp_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_code?: string
          customer_name?: string
          customer_phone?: string
          customer_message?: string | null
          total?: number
          status?: OrderStatus
          whatsapp_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          size_label: string | null
          unit_price: number
          quantity: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          size_label?: string | null
          unit_price: number
          quantity: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          size_label?: string | null
          unit_price?: number
          quantity?: number
          subtotal?: number
          created_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          whatsapp_phone: string
          instagram_url: string | null
          address: string | null
          opening_hours: string | null
          checkout_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          whatsapp_phone: string
          instagram_url?: string | null
          address?: string | null
          opening_hours?: string | null
          checkout_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          whatsapp_phone?: string
          instagram_url?: string | null
          address?: string | null
          opening_hours?: string | null
          checkout_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_hero_slides: {
        Row: {
          id: string
          eyebrow: string
          title: string
          subtitle: string | null
          description: string | null
          image_url: string
          image_alt: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          eyebrow?: string
          title: string
          subtitle?: string | null
          description?: string | null
          image_url: string
          image_alt?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          eyebrow?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          image_url?: string
          image_alt?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_order_with_items: {
        Args: {
          p_order_code: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_message?: string | null
          p_items: {
            product_id: string
            quantity: number
            size_label?: string | null
          }[]
        }
        Returns: {
          order_id: string
          order_code: string
          total: number
          product_id: string
          product_name: string
          size_label: string | null
          unit_price: number
          quantity: number
          subtotal: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type AdminUserRow = Database['public']['Tables']['admin_users']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductImageRow = Database['public']['Tables']['product_images']['Row']
export type ProductSizeRow = Database['public']['Tables']['product_sizes']['Row']
export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type StoreSettingsRow = Database['public']['Tables']['store_settings']['Row']
export type HomeHeroSlideRow = Database['public']['Tables']['home_hero_slides']['Row']
