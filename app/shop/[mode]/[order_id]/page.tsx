'use client';

import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Button, Modal } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/utils/types';
import { shopCarts } from '@/app/actions';

export default function OrderPage({ params }: { params: { mode: string, order_id: string } }) {
  const { mode, order_id } = params;
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  interface Cart {
    [productId:string]: number
  }
  const [cart, setCart] = useState<Cart>({});
  const [opened, { open, close }] = useDisclosure(false);

  const getProducts = async () => {
    const { data } = await supabase.from('products').select('name,product_id,unit,spec');
    if (data) {
      const products:Product[] = data;

      const rs = products.map((product:Product) => (
        <li key={product.product_id} className="py-5">
          <div>
            <p className="py-2">{product.name}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>數量:<b> {cart[product.product_id] ? cart[product.product_id] : 0} {product.unit} </b>
            </p>
            <p className="font-sm">({product.spec})</p>
            <div className="grid grap-x-8 grid-cols-2">
              <Button
                variant="outline"
                radius="xl"
                className="rounded-full border-2 border-gray-400 size-8 flex justify-center items-center mr-3"
                onClick={
                  () =>
                  setCart({
                    ...cart,
                    [product.product_id]:
                      cart[product.product_id] ? cart[product.product_id] + 1 : 1,
                  })
                }>+
              </Button>
              <Button
                variant="outline"
                radius="xl"
                className="rounded-full border-2 border-gray-400 size-8 flex justify-center items-center"
                disabled={cart[product.product_id] === 0 || cart[product.product_id] === undefined}
                onClick={
                  () =>
                  setCart({
                    ...cart,
                    [product.product_id]:
                      cart[product.product_id] ? cart[product.product_id] - 1 : 1,
                  })
                }>-
              </Button>
            </div>
          </div>
        </li>
      ));
      setRows(rs);
    }
  };

  useEffect(() => {
    getProducts();
  }, [cart]);

  return (
    <>
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
      <div className="flex justify-between py-5 items-center">
        <h2 className="font-bold">選擇商品</h2>
        <Button
          variant="light"
          radius="xl"
          disabled={!(Object.values(cart).some(value => value > 0))}
          onClick={() => {
            shopCarts(
              mode,
              order_id,
              Object.entries(cart).map(([key, value]) => ({ product_id: key, quantity: value }))
            ).then(() => open());
          }
        }
        >送出
        </Button>
      </div>
      {rows}
      <div className="flex justify-end py-5 items-center">
        <Button
          variant="light"
          radius="xl"
          disabled={!(Object.values(cart).some(value => value > 0))}
          onClick={() => {
            shopCarts(
              mode,
              order_id,
              Object.entries(cart).map(([key, value]) => ({ product_id: key, quantity: value }))
            ).then(() => open());
          }}
        >送出
        </Button>
      </div>
    </ul>
    </>
  );
}
