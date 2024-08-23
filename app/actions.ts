'use server';

import { Cart } from '@/utils/types';
import { logger } from '@/utils/logger';

export const confirmOrder = async (order_id:string) => {
  'use server';

  const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}yslc/payment/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
    },
    body: JSON.stringify({
      order_id,
    }),
  });
  console.log(resp);
};

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

export const analysisQuery = async (prompt:string) => {
  'use server';

  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}yslc/analysis`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
    },
    body: JSON.stringify({
      prompt,
    }),
  });
  const data = await resp.json();
  return data;
};
