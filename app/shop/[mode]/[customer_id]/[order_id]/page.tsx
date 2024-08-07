'use client';

import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { MantineProvider, Text, Box, Group, Button, Modal } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import { Product, Customer, PaymentOption } from '@/utils/types';
import { shopCarts } from '@/app/actions';

export default function OrderPage(
  { params }: { params: { mode: string, customer_id: string, order_id: string } }
) {
  const { mode, customer_id, order_id } = params;
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  interface Cart {
    [productId:string]: number
  }
  const [customer, setCustomer] = useState<Customer>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [totalFee, setTotalFee] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);

  const getCustomer = async () => {
    const { data } = await supabase
    .from('customers')
    .select('name, customer_id, payment_options')
    .eq('customer_id', customer_id);
    if (data) {
      const [c] = data;
      setCustomer(c);
    }
  };

  const getProducts = async () => {
    // 月結客戶我們不顯示金額
    const { data } = await supabase
    .from('AvailableProducts')
    .select(`
        name,
        product_id,
        unit,
        stock_quantity,
        spec,
        price`)
    .eq('is_active', true)
    .eq('customer_id', customer_id)
    .order('product_id', { ascending: true });
    if (data) {
      const ps:Product[] = data;
      setProducts(ps);
    }
  };

  const listProducts = () => {
      const rs = products.map((product:Product) => (
        <li key={product.product_id} className="py-5">
          <Group className="flex justify-between">
            <Text className="py-2">{product.name}</Text>
            <Text
              className={(!customer ||
              (customer.payment_options !== undefined &&
                customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT))) ? 'invisible' : 'py-2'}
            >單價: {Number(product.price).toLocaleString()}元
            </Text>
          </Group>
          <div className="flex justify-between items-center">
            <Text size="sm">
              數量:<b> {cart[product.product_id] ? cart[product.product_id] : 0} {product.unit} </b>
            </Text>
            <Text className={!product.spec ? 'invisible' : ''} size="sm">({product.spec})</Text>
            <div className="grid grap-x-8 grid-cols-2">
              <Button
                variant="outline"
                radius="xl"
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
                }>+
              </Button>
              <Button
                variant="outline"
                radius="xl"
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
                }>-
              </Button>
            </div>
          </div>
        </li>
      ));
      setRows(rs);
  };

  useEffect(() => {
    listProducts();
  }, [products, cart, customer]);

  useEffect(() => {
    getCustomer();
    getProducts();
  }, []);

  return (
    <MantineProvider>
      <Modal
        opened={opened}
        onClose={close}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
      >
        <h2>訂單已送出</h2>
        <p>請關閉視窗回到 Line 做最後的確認</p>
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
                    (customer.payment_options !== undefined &&
                    customer.payment_options.includes(PaymentOption.MONTHLY_PAYMENT)))}
                  size="sm">
                  總金額: {Number(totalFee).toLocaleString()} 元
                </Text>
                <Button
                  variant="light"
                  radius="xl"
                  disabled={!(Object.values(cart).some(value => value > 0))}
                  onClick={() => {
                    shopCarts(
                      mode,
                      order_id,
                      Object.entries(cart)
                        .map(([key, value]) => ({ product_id: key, quantity: value }))
                        .filter((item) => item.quantity > 0),
                      customer_id
                    ).then(() => open());
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
          <Group className="justify-end py-5 items-center">
            <Button
              variant="light"
              radius="xl"
              disabled={!(Object.values(cart).some(value => value > 0))}
              onClick={() => {
                shopCarts(
                  mode,
                  order_id,
                  Object.entries(cart)
                      .map(([key, value]) => ({ product_id: key, quantity: value }))
                      .filter((item) => item.quantity > 0),
                  customer_id
                ).then(() => open());
              }}
            >送出
            </Button>
          </Group>
        </Box>
      </ul>
    </MantineProvider>
  );
}
