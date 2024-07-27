import { MantineProvider, Group, Flex, Box, Text } from '@mantine/core';
import { createClient } from '@/utils/supabase/server';
import { Customer, Order, OrderState, PaymentOption, TAX_RATE } from '@/utils/types';

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
    shipping_fee: 0.0,
  };
  let untax_total = 0;
  if (data && data.length > 0) {
    [order] = data;

    order.items.forEach((item) => {
      untax_total += item.subtotal;
    });
  }
  let customer:Customer | undefined;
  const resp = await supabase.from('customers').select(`
    *,
    customer:parent_id (customer_id, name, payment_option)
  `).eq('customer_id', order.customer_id);
  if (resp.data && resp.data.length > 0) {
    [customer] = resp.data;
  }

  const tax = order.tax ?? TAX_RATE;
  const shipping_fee = order.shipping_fee ?? 0;
  const service_fee = order.service_fee ?? 0;
  const total_with_tax = (untax_total + shipping_fee + service_fee) * (1 + tax);
  const getStatus = (state:string) => {
    let payment_option = customer?.payment_options;
    if (customer?.customers?.payment_options) {
      payment_option = customer?.customers.payment_options;
    }
    if (payment_option?.includes(PaymentOption.MONTHLY_PAYMENT)) {
      return '月結';
    }
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
              <Text
                hidden={
                  !customer ||
                  (customer.payment_options !== undefined &&
                  customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT))}
                className="font-medium text-lg leading-8">{Number(item.subtotal).toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
        <Flex
          direction="column"
          gap="md"
          align="flex-start"
          className={(
            !customer ||
            (customer.payment_options !== undefined &&
            customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT))) ? 'invisible' : ''}
        >
          <div className="w-full total flex items-center justify-between pt-6">
            <p className="font-normal text-lg leading-8">未稅價</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(untax_total).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-6">
            <p className="font-normal text-lg leading-8">運費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(shipping_fee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-6">
            <p className="font-normal text-lg leading-8">貨到付款手續費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(service_fee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-6">
            <p className="font-normal text-lg leading-8">稅金</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round((untax_total + shipping_fee) * tax)).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-6">
            <p className="font-normal text-xl leading-8">總金額</p>
            <h5 className="font-manrope font-bold text-2xl leading-9">{Number(Math.round(total_with_tax)).toLocaleString()}</h5>
          </div>
        </Flex>
      </div>
    </MantineProvider>
  );
}
