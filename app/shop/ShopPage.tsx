'use client';

import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  MantineProvider,
  Text,
  Title,
  Box,
  Group,
  Button,
  Modal,
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
  shopCarts,
  LineProfile,
} from './actions';
import { ProductView, Customer, Order } from '@/utils/database';
import { logger, LogAction } from '@/utils/logger';

interface Cart {
  [id:string]: number
}

type ShopProps = {
  customer_id: string;
  order_id: string;
  carts: Cart;
  products: ProductView[];
  order: Order | null;
  customer: Customer;
};
export function Shop({ customer_id, order_id, carts, products, order, customer }: ShopProps) {
  let total = 0;
  for (const pid of Object.keys(carts)) {
    const quantity = carts[pid];
    const product = products.find((p) => String(p.id) === pid);
    if (product && product.price) {
      total += Math.round(product.price * quantity);
    }
  }

  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart>(carts);
  const [totalFee, setTotalFee] = useState<number>(total);
  const [opened, { open, close }] = useDisclosure(false);
  const [liffCtx, setLiffCtx] = useState<Liff>();
  const [lineProfile, setLineProfile] = useState<LineProfile>();

  const getQuantity = (id:number) => {
    if (cart[id] && cart[id]) {
      if ((id === 112 || id === 5) && (cart[id] % 6 === 0) && cart[id] !== 0) {
        return `${cart[id]} + ${Math.round(cart[id] / 6)}`;
      }
      return cart[id].toString();
    }
    return '0';
  };

  const getUnitPrice = (product:ProductView) => {
    if ((product.id === 112 || product.id === 5) && cart[product.id] && cart[product.id] >= 10) {
      return 720;
    }
    return product.price;
  };

  const listProducts = () => {
    if (products.length === 0) {
      setRows([(<Text fs="italic" fw={300}>尚未完成商品設定</Text>)]);
    } else {
      const rs = products.map((product:ProductView) => (
        <li key={product.id} className="py-5">
          <Group className="flex justify-between">
            <Text className="py-2">{product.name}</Text>
            <Text
              className={(!customer ||
              (customer.payment_options !== null &&
                customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT))) ? 'invisible' : 'py-2'}
            >售價: {Number(getUnitPrice(product)).toLocaleString()}元
            </Text>
          </Group>
          <div className="flex justify-between items-center">
            <Text size="sm" fw={cart[product.id] ? 700 : 100}>
              數量:{getQuantity(product.id)} {product.unit}
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
                      [product.id]:
                        cart[product.id] ? cart[product.id] + 1 : 1,
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
                disabled={cart[product.id] === 0 || cart[product.id] === undefined}
                onClick={
                  () => {
                    setCart({
                      ...cart,
                      [product.id]:
                      cart[product.id] ? cart[product.id] - 1 : 1,
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
    }
  };

  const orderDisabled = (o:Order | undefined | null) => {
    if (o === undefined || o === null) {
      return false;
    }
    if (o.state === OrderState.CANCELLED
      || o.state === OrderState.CONFIRMED
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
    liff.init({
      liffId: process.env.NEXT_PUBLIC_SHOP_LIFF_ID || '',
    }).then(() => {
      setLiffCtx(liff);
    });
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
                      order_id,
                      Object.entries(cart)
                        .map(([key, value]) => ({ id: Number(key), quantity: value }))
                        .filter((item) => item.quantity > 0),
                      customer_id,
                      lineProfile,
                    ).then(() => { open(); setTimeout(() => { liffCtx?.closeWindow(); }, 2000); });
                  }
                }
                >送出
                </Button>
              </Group>
            </Group>
          </header>
        </Box>
        {rows}
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
                  order_id,
                  Object.entries(cart)
                      .map(([key, value]) => ({ id: Number(key), quantity: value }))
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
