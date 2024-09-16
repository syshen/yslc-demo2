import {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  customers: CustomersTable
  products: ProductsTable
  messages: MessagesTable
  customer_products: CustomerProductsTable
  orders: OrdersTable
  view_products: ProductsView
  view_customers: CustomersView
}

export interface CustomersTable {
  id: Generated<number>
  name: string
  customer_id: string
  line_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
  shipping_address: string | null
  contact_phone_1: string | null
  contact_phone_2: string | null
  line_group_name: string | null
  parent_id: string | null
  payment_options: string | null
}

export interface OrderItem {
  item: string
  id: number
  price: number
  unit: string
  product: string
  quantity: number
  subtotal: number
  gift?: number
}

export interface OrdersTable {
  id: Generated<number>
  order_id: string
  items: JSONColumnType<OrderItem[]>
  customer_id: string
  message_id: string | null
  payment_option: string | null
  account_number: string | null
  state: string
  total: number | null
  tax: number | null
  shipping_fee: number | null
  payment_status: string | null
  service_fee: number | null
  line_user_info: JSONColumnType<{
    userId: string
    displayName: string
    pictureUrl: string | null
  }>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ProductsTable {
  id: Generated<number>
  name: string
  product_id: string
  unit: string | null
  unit_price: number | null
  spec: string | null,
  stock_status: string | null,
  stock_quantity: number | null,
  is_active: boolean | null,
  base_unit: string | null,
  base_unit_quantity: number | null,
  gift_quantity: number | null,
  created_at: ColumnType<Date, string | undefined, never>
}

export interface MessagesTable {
  id: Generated<number>
  message_id: string
  type: string | null
  user_id: string | null
  group_id: string | null
  group_name: string | null
  user_name: string | null
  message: string
  customer_id: string | null
  user_profile_url: string | null
  created_at: ColumnType<Date, string | undefined | never, never>
}

export interface CustomerProductsTable {
  id: Generated<number>
  customer_id: string
  product_id: string
  pid: number
  unit_price: number | null
  is_available: boolean | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface CustomersView {
  customer_id: string
  parent_id: string
  name: string
  line_id: string
  line_group_name: string
  payment_options: string
  shipping_address: string
  contact_phone_1: string
  contact_phone_2: string
  stores: JSONColumnType<{
    id: number
    customer_id: string
    name: string
    line_id: string | null
    created_at: Date
  }[]>
}

export interface ProductsView {
  id: number
  name: string
  product_id: string
  unit: string
  orig_unit_price: number
  custom_unit_price:number
  spec: string | null
  stock_status: string
  stock_quantity: number | null
  is_active: boolean | null
  customer_id: string
  price: number
  is_available: boolean
}

export type Customer = Selectable<CustomersTable>;
export interface CustomerWithParent extends Customer {
  parent_name: string | null
}
export type ExtendedCustomer = Selectable<CustomersView>;
export type CustomerProduct = Selectable<CustomerProductsTable>;
export type UpdateCustomer = Updateable<CustomersTable>;
export type NewCustomer = Insertable<CustomersTable>;
export type NewCustomerProducts = Insertable<CustomerProductsTable>;
export interface ProductWithCustomPrice extends Product {
  custom_price: {
    id: number,
    product_id: string,
    unit_price: number | null,
    is_available: boolean | null
  } | null
}

export type Order = Selectable<OrdersTable>;
export interface OrderWithCustomer extends Order {
  customer: {
    customer_id: string
    name: string
    shipping_address: string | null
    contact_phone_1: string | null
    contact_phone_2: string | null
  } | null
}
export type NewOrder = Insertable<OrdersTable>;
export type UpdateOrder = Updateable<OrdersTable>;

export type Product = Selectable<ProductsTable>;
export type NewProduct = Insertable<ProductsTable>;
export type UpdateProduct = Updateable<ProductsTable>;
export type ProductView = Selectable<ProductsView>;

export type Message = Selectable<MessagesTable>;
export type NewMessage = Insertable<MessagesTable>;
