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

export enum PaymentState {
  PENDING = 'pending',
  VERIFYING = 'verifying',
  PAID = 'paid',
}

export enum OrderState {
  NONE = '',
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

export interface LineInfo {
  line_id: string
  displayName: string
  pictureUrl: string
}
/*
export interface Order {
  order_id: string
  created_at: string
  total: number
  items: OrderItem[]
  payment_option: string
  account_number: string
  customer_id: string
  state: OrderState
  payment_status: PaymentState
  tax: number
  shipping_fee?: number
  service_fee?: number
  customers?: Customer
  line_user_info?: LineInfo
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
  parent_name?: string
}

export interface CustomerProduct {
  customer_id: string;
  price?: number;
  product_id?: number;
  is_available?: boolean;
}

export interface Product {
  id?: number
  created_at?: string
  product_id: number
  name: string
  unit: string
  unit_price?: number
  spec?: string
  price?: number
  stock_status?: string
  stock_quantity?: number | null
  is_active?: boolean
  base_unit?: string
  base_unit_quantity?: number
  gift_quantity?: number
  customer_products?: CustomerProduct[]
}*/

export interface Cart {
  product_id: string
  quantity: number
}
