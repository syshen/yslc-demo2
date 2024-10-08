'use server';

import {
  jsonObjectFrom,
} from 'kysely/helpers/postgres';

import {
  db,
  OrderState,
  PaymentOption,
  PaymentState,
  OrderWithCustomer,
} from '@/utils/db';

export async function getProducts() {
  'use server';

  const results = await db
    .selectFrom('products')
    .selectAll()
    .execute();

  return results;
}

export async function getCustomers() {
  'use server';

  const results = await db
    .selectFrom('customers')
    .selectAll()
    .execute();

  return results;
}

export async function updateOrderStatus(order_id:string, state:OrderState) {
  'use server';

  await db.updateTable('orders').set({
    state,
  }).where('order_id', '=', order_id).execute();
}

export async function updatePaymentStatus(order_id:string, state:PaymentState) {
  'use server';

  await db.updateTable('orders').set({
    payment_status: state,
  }).where('order_id', '=', order_id).execute();
}

export async function getOrders(
  includeCancelled:boolean,
  includePendingPayment:boolean,
  includePendingShipping:boolean,
  includeShipped:boolean,
  dateRanges:[Date | null, Date | null],
  selectedCustomer:string | null): Promise<OrderWithCustomer[]> {
  'use server';

  const builder = db
    .selectFrom('orders')
    .select((eb) => [
      'id',
      'created_at',
      'customer_id',
      'account_number',
      'items',
      'line_user_info',
      'message_id',
      'order_id',
      'total',
      'state',
      'payment_status',
      'tax',
      'shipping_fee',
      'service_fee',
      'payment_option',
      'account_message_id',
      jsonObjectFrom(
        eb.selectFrom('customers')
          .select(['customer_id', 'name', 'shipping_address', 'contact_phone_1', 'contact_phone_2'])
          .whereRef('orders.customer_id', '=', 'customers.customer_id')
      ).as('customer'),
      jsonObjectFrom(
        eb.selectFrom('messages')
          .select(['message_id', 'message', 'user_name', 'user_profile_url'])
          .whereRef('orders.message_id', '=', 'messages.message_id')
      ).as('message'),
      jsonObjectFrom(
        eb.selectFrom('messages')
          .select(['image_key'])
          .whereRef('orders.account_message_id', '=', 'messages.message_id')
      ).as('account_message'),
    ])
    .$if(!includeCancelled, (eb) => eb.where('state', '!=', OrderState.CANCELLED))
    .$if(!includePendingPayment, (eb) => eb.where((fb) => fb.or([
      fb('payment_option', '!=', PaymentOption.BANK_TRANSFER),
      fb('payment_status', '!=', PaymentState.PENDING),
    ])))
    .$if(!includePendingShipping, (eb) => eb.where((fb) => fb.or([
      fb('payment_option', '!=', PaymentOption.BANK_TRANSFER),
      fb('payment_status', '!=', PaymentState.PAID),
      fb('state', '!=', OrderState.CONFIRMED),
    ])))
    .$if(!includePendingShipping, (eb) => eb.where((fb) => fb.or([
      fb('payment_option', '!=', PaymentOption.MONTHLY_PAYMENT),
      fb('state', '!=', OrderState.CONFIRMED),
    ])))
    .$if(!includePendingShipping, (eb) => eb.where((fb) => fb.or([
      fb('payment_option', '!=', PaymentOption.PAY_ON_RECEIVE),
      fb('state', '!=', OrderState.CONFIRMED),
    ])))
    .$if(!includeShipped, (eb) => eb.where('state', '!=', OrderState.SHIPPED)).where('state', '!=', OrderState.DELIVERED)
    .$if(dateRanges[0] !== null, (eb) => eb.where('created_at', '>=', dateRanges[0]))
    .$if(dateRanges[1] !== null, (eb) => eb.where('created_at', '<=', dateRanges[1]))
    .$if(selectedCustomer !== null, (eb) => eb.where('customer_id', '=', selectedCustomer))
    .orderBy('created_at', 'desc');
/*
  if (!includeCancelled) {
    builder = builder
      .where('state', '!=', OrderState.CANCELLED);
  }
  if (!includePendingPayment) {
    builder = builder
      .where('payment_option', '!=', PaymentOption.BANK_TRANSFER)
      .where('payment_status', '!=', PaymentState.PAID);
  }
  if (!includePendingShipping) {
    builder = builder
      .where('payment_option', '!=', PaymentOption.BANK_TRANSFER)
      .where('payment_status', '!=', PaymentState.PAID)
      .where('state', '!=', OrderState.CONFIRMED);
  }
  if (!includeShipped) {
    builder = builder
      .where('state', '!=', OrderState.SHIPPED);
  }
  if (selectedCustomer) {
    builder = builder
      .where('customer_id', '=', selectedCustomer);
  }

  if (dateRanges[0]) {
    builder = builder.where('created_at', '>=', dateRanges[0]);
  }
  if (dateRanges[1]) {
    builder = builder.where('created_at', '<=', dateRanges[1]);
  }

  builder = builder.orderBy('created_at', 'desc');
  */
  // const sql = builder.compile();
  // console.log(sql);
  const results = await builder.execute();
  // console.log(results);
  return results;
}
