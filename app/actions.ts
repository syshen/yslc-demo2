'use server';

import { Cart } from '@/utils/types';

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

export const shopCarts = async (mode: string, customer_id:string, carts: Cart[]) => {
  'use server';

  let url = '';
  if (mode === 'test') {
    url = `${process.env.NEXT_PUBLIC_BACKEND_TEST_URL}yslc/shop`;
  } else {
    url = `${process.env.NEXT_PUBLIC_BACKEND_URL}yslc/shop`;
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
    },
    body: JSON.stringify({
      customer_id,
      carts,
    }),
  });
  window.close();
};
