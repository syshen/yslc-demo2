'use server';

import {
  db,
} from '@/utils/db';
import { Cart } from '@/utils/types';
import { logger } from '@/utils/logger';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

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

export const getOrderById = async (order_id:string) => {
  'use server';

  const results = await db.selectFrom('orders').selectAll().where('order_id', '=', order_id).executeTakeFirst();
  return results;
};

export const shopCarts = async (
  mode: string,
  order_id:string,
  carts: Cart[],
  customer_id:string,
  profile?:LineProfile
) => {
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
      JIDOU_API_KEY: `${process.env.JIDOU_API_KEY}`,
    },
    body: JSON.stringify({
      customer_id,
      order_id,
      carts,
      profile,
    }),
  });
  if (resp.status !== 200) {
    logger.error(`Calling ${url} with error: ${await resp.text()}`);
  }
};
