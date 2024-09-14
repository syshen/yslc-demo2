'use server';

import {
  db,
} from '@/utils/db';

export const getOrderById = async (order_id:string) => {
  'use server';

  const results = await db.selectFrom('orders').selectAll().where('order_id', '=', order_id).executeTakeFirst();
  return results;
};

export const getCustomerById = async (customer_id:string) => {
  'use server';

  const results = await db.selectFrom('customers').selectAll().where('customer_id', '=', customer_id).executeTakeFirst();
  return results;
};

export const getProductsByIds = async (pids:number[]) => {
  'use server';

  const products = await db.selectFrom('products').selectAll().where('id', 'in', pids).execute();
  return products;
};
