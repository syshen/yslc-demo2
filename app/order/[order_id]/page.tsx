import {
  MantineProvider,
  Image,
  Flex,
  Box,
  Group,
  Text,
  Badge,
  Stack,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconUserCircle,
  IconNumber,
  IconChefHat,
} from '@tabler/icons-react';
import { createClient } from '@/utils/supabase/server';
import { Customer, Order, OrderState, PaymentOption, TAX_RATE, PaymentState, OrderItem } from '@/utils/types';

export default async function OrderPage({ params }: { params: { order_id: string } }) {
  const { order_id } = params;
  const supabase = createClient();
  const { data } = await supabase.from('orders').select().eq('order_id', order_id);
  let order:Order = {
    total: 0,
    created_at: '',
    items: [],
    order_id: '',
    payment_option: '',
    account_number: '',
    customer_id: '',
    state: OrderState.NONE,
    payment_status: PaymentState.PENDING,
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
    customer:parent_id (customer_id, name, payment_options)
  `).eq('customer_id', order.customer_id);
  if (resp.data && resp.data.length > 0) {
    [customer] = resp.data;
  }

  const product_ids:number[] = [];
  for (const item of order.items) {
    if (item.id) {
      product_ids.push(item.id);
    }
  }
  const { data: products } = await supabase.from('products').select().in('product_id', product_ids);
  const findProduct = (product_id:number) => {
    if (products && products.length > 0) {
      for (const product of products) {
        if (product.product_id === product_id) {
          return product;
        }
      }
    }
    return null;
  };

  const tax = order.tax ?? TAX_RATE;
  const shipping_fee = order.shipping_fee ?? 0;
  const service_fee = order.service_fee ?? 0;
  const total_with_tax = (untax_total + shipping_fee + service_fee) * (1 + tax);
  const getStatus = (state:string) => {
    switch (state) {
      case OrderState.CANCELLED:
        return (<Badge fullWidth color="red" size="lg">已取消</Badge>);
      case OrderState.SHIPPED:
        return (<Badge fullWidth color="green" size="lg">已出貨</Badge>);
      case OrderState.COMPLETED:
        return (<Badge fullWidth color="green" size="lg">訂單已完成</Badge>);
    }
    if (order.payment_option === PaymentOption.BANK_TRANSFER) {
      if (order.payment_status === PaymentState.PAID) {
        return (<Badge fullWidth color="yellow" size="lg">待出貨</Badge>);
      }
      if (order.account_number && order.account_number.length > 1) {
        return (<Badge fullWidth color="yellow" size="lg">待確認付款</Badge>);
      }
      return (<Badge fullWidth color="red" size="lg">待付款</Badge>);
    }

    // 月結
    // 貨到付款
    if (order.state === OrderState.CONFIRMED) {
      return (<Badge fullWidth color="yellow" size="lg">待出貨</Badge>);
    }
    return '';
  };

  const getPaymentOption = (option:string | undefined) => {
    switch (option) {
      case PaymentOption.MONTHLY_PAYMENT:
        return '月結';
      case PaymentOption.PAY_ON_RECEIVE:
        return '貨到付款';
      case PaymentOption.BANK_TRANSFER:
        return '銀行轉帳';
    }
    return '';
  };

  const userProfile = () => {
    if (order.line_user_info) {
      return (
      <Group>
        <IconUserCircle color="gray" />
        <Text size="sm">{order.line_user_info.displayName}</Text>
        <Image
          w={20}
          radius="100%"
          src={order.line_user_info.pictureUrl}
        />
      </Group>);
    }
    return '';
  };
  const customerInfo = () => {
    if (customer) {
      return (
        <Group>
          <IconChefHat color="gray" />
          <Flex direction="column">
            <Text size="sm">{customer.name}</Text>
            {/* <Text size="sm">{customer.shipping_address}</Text> */}
          </Flex>
        </Group>
      );
    }
    return '';
  };

  const itemInfo = (item:OrderItem) => {
    const product = findProduct(item.id);
    if (product && product.spec) {
      return `${product.name} (${product.spec})`;
    }
    return `${item.item}`;
  };

  return (
    <MantineProvider>
      <Flex direction="column" className="w-full border p-6 border-gray-200">
        <Stack className="pb-6">
          <h2
            className="font-manrope font-bold text-3xl leading-10">
            商品訂購單
          </h2>
          <Group>
              <Text size="sm" className="leading-10">詠鑠生活股份有限公司</Text>
          </Group>
        </Stack>
        <Flex direction="row" className="border-b py-5">
          <Flex direction="column" className="flex-1 gap-2">
            { customerInfo() }
            { userProfile()}
            <Group>
              <IconCalendarEvent color="gray" />
              <Text size="sm">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</Text>
            </Group>
            <Group>
              <IconNumber color="gray" />
              <Text size="sm">{order.order_id}</Text>
            </Group>
          </Flex>
          <Box>
            {getStatus(order.state)}
          </Box>
        </Flex>
        <div className="data py-6 border-b border-gray-200">
          {order.items.map((item) => (
            <div key={item.item} className="flex items-center justify-between gap-4 mb-5">
              <div className="flex flex-col">
                <p className="font-normal text-lg leading-8 transition-all duration-500">{itemInfo(item)}</p>
                <p className="font-noraml text-lg leading-8 transition-all duration-500">數量: {item.quantity}{item.unit}</p>
              </div>
              <Text
                hidden={order.payment_option.includes(PaymentOption.MONTHLY_PAYMENT)}
                className="font-medium text-lg leading-8">{Number(item.subtotal).toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
        { order.payment_option.includes(PaymentOption.MONTHLY_PAYMENT) ? '' : (
        <Flex
          direction="column"
          gap="md"
          align="flex-start"
        >
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">未稅價</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(untax_total).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">運費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(shipping_fee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">貨到付款手續費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(service_fee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">稅金 (5%)</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round((untax_total + shipping_fee) * tax)).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">總金額</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round(total_with_tax)).toLocaleString()} 元</h5>
          </div>
        </Flex>
        )}
        <div className="w-full total flex items-center justify-between pt-3">
          <p className="font-normal text-lg leading-8">付款方式</p>
          <h5 className="font-manrope font-normal text-lg leading-9">{getPaymentOption(order.payment_option)}</h5>
        </div>

      </Flex>
    </MantineProvider>
  );
}
