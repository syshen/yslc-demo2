'use server';

export const notify = async (payload:Record<string, any>) => {
  'use server';

  const url = `${process.env.BACKEND_URL}yslc/message`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      JIDOU_API_KEY: `${process.env.JIDOU_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (resp.status !== 200) {
    throw new Error(resp.statusText);
  }
};
