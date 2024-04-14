export interface OrderItem {
  item: string
  id: number
  units: number
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
}

export interface Order {
  order_id: string
  created_at: string
  confirmed: boolean
  confirmed_at: string
  paid: boolean
  paid_at: string
  total: number
  items: OrderItem[],
  line_id: string
}
export interface Customer {
  id: number
  created_at: string
  customer_id: string
  name: string
  line_id: string
  payment_term: string
  contact_phone_1: string
  contact_phone_2: string
  shipping_address: string
}
