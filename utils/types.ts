export interface OrderItem {
  item: string
  units: number,
  subtotal: number,
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
