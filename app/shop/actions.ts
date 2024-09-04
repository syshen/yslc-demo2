'use server';

import {
  db,
} from '@/utils/db';

export async function getCustomerBy(customer_id: string) {
  'use server';

  const results = await db
    .selectFrom('customers')
    .selectAll()
    .where('customer_id', '=', customer_id)
    .executeTakeFirst();
  return results;
}

export async function getProductsBy(customer_id:string) {
  'use server';

  const results = await db
    .selectFrom('view_products')
    .selectAll()
    .where('customer_id', '=', customer_id)
    .orderBy('product_id', 'asc')
    .execute();
  return results;
}
