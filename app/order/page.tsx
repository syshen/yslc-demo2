'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
// import { useRouter } from 'next/router';
import {
  MantineProvider,
  Image,
  Flex,
  Box,
  Group,
  Text,
  Badge,
  Stack,
  Loader,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconUserCircle,
  IconNumber,
  IconChefHat,
} from '@tabler/icons-react';
import liff from '@line/liff';
import { OrderState, PaymentOption, TAX_RATE, PaymentState } from '@/utils/types';
import { logger, LogAction } from '@/utils/logger';
import { OrderItem } from '@/utils/db';
import { Customer, Order, Product } from '@/utils/database';
import { getOrderById, getCustomerById, getProductsByIds } from './actions';

export default function OrderPage() {
  return (
    <Suspense><OrderInfo /></Suspense>
  );
}

function OrderInfo() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order>();
  const [loading, setLoading] = useState<boolean>(false);
  const [customer, setCustomer] = useState<Customer>();
  const [products, setProducts] = useState<Product[]>();
  const [tax, setTax] = useState<number>(TAX_RATE);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [unTaxTotal, setUnTaxTotal] = useState<number>(0);

  const order_id:string = searchParams.get('oid') || '';
  console.log(order_id);

  const getOrder = async () => {
    const o = await getOrderById(order_id);
    if (o === null || o === undefined) {
      // 404 not found
      notFound();
    }
    setOrder(o);
  };

  useEffect(() => {
    if (!order) {
      return;
    }

    const p1 = getCustomerById(order.customer_id).then((c) => {
      if (c) {
        setCustomer(c);
      }
    });

    const pids:number[] = [];
    for (const item of order.items) {
      pids.push(item.id);
    }

    const p2 = getProductsByIds(pids).then((ps) => {
      if (ps) {
        setProducts(ps);
      }
    });

    setTax(order.tax ?? TAX_RATE);
    setShippingFee(order.shipping_fee ?? 0);
    setServiceFee(order.service_fee ?? 0);
    if (order) {
      let t = 0;

      order.items.forEach((item) => {
        t += item.subtotal;
      });
      setUnTaxTotal(t);
    }

    Promise.all([p1, p2]).then(() => {
      setLoading(false);
    });
  }, [order]);

  const findProduct = (id:number) => {
    if (products && products.length > 0) {
      for (const product of products) {
        if (product.id === id) {
          return product;
        }
      }
    }
    return null;
  };

  const getStatus = (state:string) => {
    if (!order) {
      return '';
    }
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

  const getPaymentOption = (option:string | undefined | null) => {
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
    if (!order) {
      return '';
    }
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

  /**
   * Return the name of the product, with spec if available.
   * If the product is not found, return the item name.
   * @param {Object} item an item in the order
   * @return {string} a string that describes the item
   */
  const itemInfo = (item:OrderItem) => {
    const product = findProduct(item.id);
    if (product && product.spec) {
      return `${product.name} (${product.spec})`;
    }
    return `${item.item}`;
  };

  logger.info(`View order page for order: ${order_id}`, {
    action: LogAction.VIEW_PAGE,
    page: 'order',
    order: {
      order_id,
    },
  });

  useEffect(() => {
    liff.init({
      liffId: '2006159272-j3vD3Kvk',
    });
    setLoading(true);
    getOrder();
  }, []);

  const pageLoading = () => (
    <Box className="flex justify-center">
      <Loader color="blue" type="dots" className="py-20"></Loader>
    </Box>
  );

  return (
    <MantineProvider>
      { loading ? pageLoading() : (
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
              <Text size="sm">{new Date(order?.created_at ?? '').toLocaleDateString()} {new Date(order?.created_at ?? '').toLocaleTimeString()}</Text>
            </Group>
            <Group>
              <IconNumber color="gray" />
              <Text size="sm">{order?.order_id ?? ''}</Text>
            </Group>
          </Flex>
          <Box>
            {order ? getStatus(order.state) : ''}
          </Box>
        </Flex>
        <div className="data py-6 border-b border-gray-200">
          {order?.items.map((item) => (
            <div key={item.item} className="flex items-center justify-between gap-4 mb-5">
              <div className="flex flex-col">
                <p className="font-normal text-lg leading-8 transition-all duration-500">{itemInfo(item)}</p>
                <p className="font-noraml text-lg leading-8 transition-all duration-500">數量: {item.quantity}{item.unit}</p>
              </div>
              <Text
                hidden={order.payment_option?.includes(PaymentOption.MONTHLY_PAYMENT)}
                className="font-medium text-lg leading-8">{Number(item.subtotal).toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
        { order?.payment_option?.includes(PaymentOption.MONTHLY_PAYMENT) ? '' : (
        <Flex
          direction="column"
          gap="md"
          align="flex-start"
        >
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">未稅價</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(unTaxTotal).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">運費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(shippingFee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">貨到付款手續費</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(serviceFee).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">稅金 (5%)</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round((unTaxTotal) * tax)).toLocaleString()}</h5>
          </div>
          <div className="w-full total flex items-center justify-between pt-3">
            <p className="font-normal text-lg leading-8">總金額</p>
            <h5 className="font-manrope font-bold text-lg leading-9">{Number(Math.round((unTaxTotal * (1 + tax)) + shippingFee + serviceFee)).toLocaleString()} 元</h5>
          </div>
        </Flex>
        )}
        <div className="w-full total flex items-center justify-between pt-3">
          <p className="font-normal text-lg leading-8">付款方式</p>
          <h5 className="font-manrope font-normal text-lg leading-9">{order ? getPaymentOption(order.payment_option) : ''}</h5>
        </div>

      </Flex>
      ) }
    </MantineProvider>
  );
}
