'use server';

import { createClient } from 'redis';
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

export async function measureTest(customer_id:string) {
  'use server';

  const startTime = new Date().getTime();
  await db
    .selectFrom('view_products')
    .selectAll()
    .where('customer_id', '=', customer_id)
    .orderBy('product_id', 'asc')
    .execute();
  const endTime = new Date().getTime();
  return {
    startTime,
    endTime,
  };
}

export async function getProductsBy(customer_id:string) {
  'use server';

  const results = await db
    .selectFrom('view_products')
    .selectAll()
    .where('customer_id', '=', customer_id)
    .where('is_active', 'is', true)
    .where('is_available', 'is', true)
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
  env: string,
  order_id:string,
  carts: Cart[],
  customer_id:string,
  profile?:LineProfile
) => {
  'use server';

  let url = '';
  if (env === 'staging') {
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
    throw new Error('Failed to send request');
  }
};

function dateStrForToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function uniqueOrderIdentity():Promise<string | null> {
  'use server';

  try {
    const dateStr = dateStrForToday();
    let currentCounter = 0;

    const redis = createClient({
      url: process.env.REDIS_URL,
    });

    redis.on('error', console.error);
    await redis.connect();

    const o = await redis.hGetAll('yslc');
    if (o) {
      if (dateStr !== o.date_str) {
        currentCounter = 0;
      } else {
        currentCounter = parseInt(o.id, 10) + 1;
      }
    }

    const counterStr = String(currentCounter).padStart(4, '0');

    const str = `${dateStr}${counterStr}`;
    currentCounter += 1;
    if (currentCounter > 9999) {
      currentCounter = 0;
    }

    await redis.hSet('yslc', 'date_str', dateStr);
    await redis.hSet('yslc', 'id', String(currentCounter));

    return str;
  } catch (error) {
    return null;
  }
}
