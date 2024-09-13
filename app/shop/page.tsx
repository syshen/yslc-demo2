'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import {
  MantineProvider,
  Text,
  Title,
  Box,
  Group,
  Button,
  Modal,
  Loader,
  ActionIcon,
} from '@mantine/core';
import liff, { Liff } from '@line/liff';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import {
  PaymentOption,
  OrderState,
  PaymentState,
} from '@/utils/types';
import {
  getCustomerBy,
  getProductsBy,
  getOrderById,
  shopCarts,
  LineProfile,
  uniqueOrderIdentity,
} from './actions';
import { ProductView, Customer, Order } from '@/utils/database';
import { logger, LogAction } from '@/utils/logger';

export default function ShopPage() {
  return (
    <Suspense><Shop /></Suspense>
  );
}

function Shop() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order>();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  interface Cart {
    [productId:string]: number
  }
  const mode:string = searchParams.get('mode') || 'test';
  const customer_id:string = searchParams.get('cid') || '';
  const order_id:string = searchParams.get('oid') || '';
  // list=1011:1,2003:2
  const productList = searchParams.get('list')?.split(',').map((item) => ({
    product_id: item.split(':')[0],
    quantity: item.split(':')[1],
  }));
  const carts:Cart = {};
  if (productList) {
    for (const item of productList) {
      carts[item.product_id] = parseInt(item.quantity, 10);
    }
  }

  const [customer, setCustomer] = useState<Customer>();
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [cart, setCart] = useState<Cart>(carts);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [liffCtx, setLiffCtx] = useState<Liff>();
  const [lineProfile, setLineProfile] = useState<LineProfile>();
  const [orderId, setOrderId] = useState<string>(order_id);
  // const [runningTime, setRunningTime] = useState<number>();

  const getCustomer = async () => {
    const c = await getCustomerBy(customer_id);
    if (c) {
      setCustomer(c);
    }
  };

  const getProducts = async () => {
    const startTime = new Date().getTime();
    console.log('startTime', startTime);
    const data = await getProductsBy(customer_id);
    if (data) {
      const ps:ProductView[] = data;
      let total = 0;
      for (const pid of Object.keys(cart)) {
        const quantity = cart[pid];
        const product = ps.find((p) => String(p.product_id) === pid);
        if (product && product.price) {
          total += product.price * quantity;
        }
      }
      const endTime = new Date().getTime();
      console.log('endTime', endTime, endTime - startTime);
      setTotalFee(total);
      setProducts(ps);
      setLoading(false);
    }
  };

  const listProducts = () => {
      const rs = products.map((product:ProductView) => (
        <li key={product.product_id} className="py-5">
          <Group className="flex justify-between">
            <Text className="py-2">{product.name}</Text>
            <Text
              className={(!customer ||
              (customer.payment_options !== null &&
                customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT))) ? 'invisible' : 'py-2'}
            >單價: {Number(product.price).toLocaleString()}元
            </Text>
          </Group>
          <div className="flex justify-between items-center">
            <Text size="sm" fw={cart[product.product_id] ? 700 : 100}>
              數量:{cart[product.product_id] ? cart[product.product_id] : 0} {product.unit}
            </Text>
            <Text className={!product.spec ? 'invisible' : ''} size="sm">({product.spec})</Text>
            <div className="grid grap-x-8 grid-cols-2">
              <ActionIcon
                variant="outline"
                radius="xl"
                size="lg"
                className="rounded-full border-2 border-gray-400 size-8 flex justify-center items-center mr-3"
                onClick={
                  () => {
                    setCart({
                      ...cart,
                      [product.product_id]:
                        cart[product.product_id] ? cart[product.product_id] + 1 : 1,
                    });
                    setTotalFee(totalFee + Number(product.price));
                  }
                }><IconPlus size={20} />
              </ActionIcon>
              <ActionIcon
                variant="outline"
                radius="xl"
                size="lg"
                className="rounded-full border-2 border-gray-400 size-8 flex justify-center items-center"
                disabled={cart[product.product_id] === 0 || cart[product.product_id] === undefined}
                onClick={
                  () => {
                    setCart({
                      ...cart,
                      [product.product_id]:
                      cart[product.product_id] ? cart[product.product_id] - 1 : 1,
                    });
                    setTotalFee(totalFee - Number(product.price));
                  }
                }><IconMinus size={20} />
              </ActionIcon>
            </div>
          </div>
        </li>
      ));
      setRows(rs);
  };

  const getOrder = async () => {
    if (orderId === '') {
      const oid = await uniqueOrderIdentity();
      if (oid !== null) {
        setOrderId(oid);
      }
    } else {
      const o = await getOrderById(orderId);
      if (o) {
        setOrder(o);
      }
    }
  };

  useEffect(() => {
    getOrder();
  }, [orderId]);

  const pageLoading = () => (
    <Box className="flex justify-center">
      <Loader color="blue" type="dots" className="py-20"></Loader>
    </Box>
  );

  const orderDisabled = (o:Order | undefined) => {
    if (o === undefined) {
      return false;
    }
    if (o.state === OrderState.CANCELLED
    || o.state === OrderState.COMPLETED
    || o.state === OrderState.SHIPPED
    || o.state === OrderState.DELIVERED) {
      return true;
    }
    if (o.payment_status === PaymentState.PAID) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    listProducts();
  }, [products, cart, customer]);

  useEffect(() => {
    liffCtx?.getProfile().then((profile) => {
      setLineProfile(profile);
    });
  }, [liffCtx]);

  useEffect(() => {
    setLoading(true);
    liff.init({
      liffId: '2006159272-exyY23yE',
    }).then(() => {
      setLiffCtx(liff);
    });
    getOrder();
    getCustomer();
    getProducts();
    // measureTest(customer_id).then((result) => {
    //   setRunningTime(result.endTime - result.startTime);
    // });
    logger.info(`View shop page for customer: ${customer_id}`, {
      action: LogAction.VIEW_PAGE,
      page: 'shop',
      customer: {
        customer_id,
      },
      order: {
        order_id,
      },
    });
  }, []);

  return (
    <MantineProvider>
      <Modal
        opened={orderDisabled(order)}
        onClose={close}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
      >
        <Title order={2}>無法修改訂單</Title>
        <Text>該筆訂單已在處理中，請重新送訊息下訂，謝謝</Text>
      </Modal>
      <Modal
        opened={opened}
        onClose={close}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
      >
        <Title order={2}>訂單已送出</Title>
        <Text>頁面將在 3 秒後自動關閉。</Text>
        <Text>若未自動關閉,請點擊右上角「X」</Text>
        <Text>返回 Line 頁面進行確認。</Text>
      </Modal>
      <ul className="divide-y divide-gray-100 mx-2">
        <Box className="shadow-sm">
          <header>
            <Group className="justify-between py-5 items-center sticky top-0">
              <h2 className="font-bold">請選擇商品</h2>
              <Group>
                <Text
                  hidden={(totalFee === 0) ||
                  (!customer ||
                    (customer.payment_options !== null &&
                    customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT)))}
                  size="sm">
                  總金額: {Number(totalFee).toLocaleString()} 元
                </Text>
                <Button
                  size="lg"
                  radius="xl"
                  loading={sending}
                  disabled={!(Object.values(cart).some(value => value > 0))}
                  onClick={() => {
                    setSending(true);
                    shopCarts(
                      mode,
                      orderId,
                      Object.entries(cart)
                        .map(([key, value]) => ({ product_id: key, quantity: value }))
                        .filter((item) => item.quantity > 0),
                      customer_id,
                      lineProfile,
                    ).then(() => { open(); setTimeout(() => { liffCtx?.closeWindow(); }, 3000); });
                  }
                }
                >送出
                </Button>
              </Group>
            </Group>
          </header>
        </Box>
        {loading ? pageLoading() : rows}
        <Box>
          <Group className="justify-between py-5 items-center">
            <Text
              hidden={(totalFee === 0) ||
              (!customer ||
                (customer.payment_options !== null &&
                customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT)))}
              size="sm">
              總金額: {Number(totalFee).toLocaleString()} 元
            </Text>
            <Button
              size="lg"
              radius="xl"
              loading={sending}
              disabled={!(Object.values(cart).some(value => value > 0))}
              onClick={() => {
                setSending(true);
                shopCarts(
                  mode,
                  orderId,
                  Object.entries(cart)
                      .map(([key, value]) => ({ product_id: key, quantity: value }))
                      .filter((item) => item.quantity > 0),
                  customer_id,
                  lineProfile,
                ).then(() => { open(); setTimeout(() => { liffCtx?.closeWindow(); }, 3000); });
              }}
            >送出
            </Button>
          </Group>
        </Box>
      </ul>
    </MantineProvider>
  );
}
