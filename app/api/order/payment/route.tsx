import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.formData();
  const order_id = body.get('order_id');

  try {
    await fetch(`${process.env.BACKEND_URL}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
      },
      body: JSON.stringify({
        order_id,
      }),
    });

    const url = new URL(`/order/payment/${order_id}`, req.url);
    return NextResponse.redirect(url);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
