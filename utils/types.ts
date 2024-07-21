export const TAX_RATE = 0.05;

export enum PaymentOption {
  MONTHLY_PAYMENT = 'monthlyPayment',
  BANK_TRANSFER = 'bankTransfer',
  PAY_ON_RECEIVE = 'payOnReceive',
}

export interface OrderItem {
  item: string
  id: number
  units: number
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
}

export enum OrderState {
  NONE = '',
  CONFIRMED = 'confirmed',
  PENDING_PAYMENT = 'pendingPayment',
  CANCELLED = 'cancelled',
  PENDING_VERIFY = 'pendingVerify',
  COMPLETED = 'completed',
}

export interface Order {
  order_id: string
  created_at: string
  confirmed: boolean
  confirmed_at: string
  paid: boolean
  paid_at: string
  total: number
  items: OrderItem[]
  line_id: string
  payment_option: string
  account_number: string
  customer_id: string
  state: OrderState
  tax: number
  shipping_fee?: number
}
export interface Customer {
  id?: number
  created_at?: string
  customer_id: string
  parent_id?: string
  name: string
  line_id?: string
  payment_term?: string
  contact_phone_1?: string
  contact_phone_2?: string
  shipping_address?: string
  payment_options?: string
  line_group_name?: string
  orders?: Order[]
  customers?: Customer // Parent customer
}

export interface CustomerProduct {
  customer_id: string;
  price: number;
  product_id?: string;
  is_available?: boolean;
}

export interface Product {
  id?: number
  created_at?: string
  product_id: string
  name: string
  unit: string
  unit_price?: number
  spec?: string
  price?: number
  stock_status?: string
  stock_quantity?: number | null
  is_active?: boolean
  customer_products?: CustomerProduct[]
}

export interface Cart {
  product_id: string
  quantity: number
}
