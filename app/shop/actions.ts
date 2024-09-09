'use server';

import {
  db,
} from '@/utils/db';
import { Cart } from '@/utils/types';
import { logger } from '@/utils/logger';

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

export const shopCarts = async (
  mode: string, order_id:string, carts: Cart[], customer_id:string) => {
  'use server';

  let url = '';
  if (mode === 'test') {
    url = `${process.env.NEXT_PUBLIC_BACKEND_TEST_URL}yslc/shop`;
  } else {
    url = `${process.env.NEXT_PUBLIC_BACKEND_URL}yslc/shop`;
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
    },
    body: JSON.stringify({
      customer_id,
      order_id,
      carts,
    }),
  });
  if (resp.status !== 200) {
    logger.error(`Calling ${url} with error: ${await resp.text()}`);
  }
};
