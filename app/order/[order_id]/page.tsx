import { MantineProvider, Group, Box } from '@mantine/core';
import { createClient } from '@/utils/supabase/server';
import { Order, OrderState } from '@/utils/types';

export default async function OrderPage({ params }: { params: { order_id: string } }) {
  const { order_id } = params;
  const supabase = createClient();
  const { data } = await supabase.from('orders').select().eq('order_id', order_id);
  let order:Order = {
    total: 0,
    created_at: '',
    confirmed_at: '',
    confirmed: false,
    paid: false,
    paid_at: '',
    items: [],
    order_id: '',
    line_id: '',
    payment_option: '',
    account_number: '',
    customer_id: '',
    state: OrderState.NONE,
    tax: 0.0,
  };
  let untax_total = 0;
  if (data && data.length > 0) {
    [order] = data;

    order.items.forEach((item) => {
      untax_total += item.subtotal;
    });
  }
  const getStatus = (state:string) => {
    switch (state) {
      case OrderState.CONFIRMED:
        return '已確認';
      case OrderState.PENDING_PAYMENT:
        return '待付款';
      case OrderState.CANCELLED:
        return '已取消';
      case OrderState.PENDING_VERIFY:
        return '待確認付款';
      case OrderState.COMPLETED:
        return '訂單已完成';
      default:
        return '未處理';
    }
  };

  return (
    <MantineProvider>
      <div className="p-6 border border-gray-200 w-full group transition-all duration-500">
        <Box className="shadow-sm my-5">
          <h2
            className="font-manrope font-bold text-3xl leading-10 pb-6">
            訂單內容
          </h2>
          <Group className="flex flex-row justify-between border-b py-5">
            <p>{new Date(order.created_at).toLocaleDateString()}</p>
            <p className="font-italic text-md text-right">{getStatus(order.state)}</p>
          </Group>
        </Box>
        <div className="data py-6 border-b border-gray-200">
          {order.items.map((item) => (
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex flex-col">
                <p className="font-normal text-lg leading-8 transition-all duration-500">{item.item}</p>
                <p className="font-noraml text-lg leading-8 transition-all duration-500">數量: {item.quantity}</p>
              </div>
              <p className="font-medium text-lg leading-8">{Number(item.subtotal).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="total flex items-center justify-between pt-6">
          <p className="font-normal text-lg leading-8">未稅價</p>
          <h5 className="font-manrope font-bold text-lg leading-9">{Number(untax_total).toLocaleString()}</h5>
        </div>
        <div className="total flex items-center justify-between pt-6">
          <p className="font-normal text-lg leading-8">稅金</p>
          <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round(untax_total * order.tax)).toLocaleString()}</h5>
        </div>
        <div className="total flex items-center justify-between pt-6">
          <p className="font-normal text-xl leading-8">總價</p>
          <h5 className="font-manrope font-bold text-2xl leading-9">{Number(order.total).toLocaleString()}</h5>
        </div>
      </div>
    </MantineProvider>
  );
}
