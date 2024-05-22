'use server';

export const confirmOrder = async (order_id:string) => {
  'use server';

  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
    },
    body: JSON.stringify({
      order_id,
    }),
  });
};
