'use server';

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
