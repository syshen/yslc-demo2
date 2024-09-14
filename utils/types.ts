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

export interface Cart {
  id: number
  quantity: number
}
