import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.formData();
  const order_id = body.get('order_id');

  try {
    console.log('order_id', order_id);
    await supabase.from('orders').update({ paid: true, paid_at: new Date() }).eq('order_id', order_id);
    const { data } = await supabase.from('orders').select().eq('order_id', order_id);
    if (data && data.length > 0) {
      const [order] = data;
      const { line_id } = order;
      await fetch('https://line.jidou.xyz/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          line_id,
          message: '付款完成，會儘速為您出貨',
        }),
      });
    }

    const url = new URL(`/order/payment/${order_id}`, req.url);
    return NextResponse.redirect(url);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
