'use server';

export const confirmOrder = async (order_id:string) => {
  'use server';

  const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}payment/confirm`, {
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
