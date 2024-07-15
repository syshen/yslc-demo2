'use client';

import { redirect, RedirectType } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MantineProvider, Button, Modal, Table, Checkbox, TextInput, LoadingOverlay, Text } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import classes from './customers.module.css';
import { Order } from '@/utils/types';
// import { Customer } from '@/utils/types';

export default function CustomersPage() {
  interface CustomerProduct {
    customer_id: string;
    price: number;
    product_id?: string;
    is_available?: boolean;
  }
  interface Product {
    product_id: string;
    name: string;
    unit: string;
    spec: string;
    unit_price: number;
    customer_products: CustomerProduct[];
  }
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productRows, setProductRows] = useState<JSX.Element[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts]
    = useState<string[]>([]);
  const [changed, setChanged] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
      .from('customers')
      .select(`
        *,
        orders (order_id, customer_id, created_at, confirmed, confirmed_at, paid, paid_at, total, items),
        customer_products (product_id, customer_id, price, is_available)
        `).order('created_at', { ascending: false });

      if (data) {
        const rs = data.map((row) => (
          <Table.Tr key={row.customer_id}>
          <Table.Td>{row.customer_id}</Table.Td>
          <Table.Td>{row.name}</Table.Td>
          <Table.Td>{row.contact_phone_1}, {row.contact_phone_2}</Table.Td>
          <Table.Td>{row.shipping_address}</Table.Td>
          <Table.Td>
            {
              row.orders
              .filter((order:Order) => (order.confirmed && !order.paid)).length
            }
          </Table.Td>
          <Table.Td>
            {
              row.orders
              .filter((order:Order) => order.paid)
              .reduce((accuValue:number, order:Order) => accuValue + order.total, 0)
              .toLocaleString()
            }
          </Table.Td>
          <Table.Td>
            {
              row.orders
              .filter((order:Order) => (order.confirmed && !order.paid))
              .reduce((accuValue:number, order:Order) => accuValue + order.total, 0)
              .toLocaleString()
            }
          </Table.Td>
          <Table.Td>
            <Text
              td="underline"
              size="xs"
              className="cursor-pointer"
              onClick={() => {
                setSelectedCustomer(row.customer_id);
                setChanged(false);
                setOpened(true);
            }}>{row.customer_products.length === 0 ? '設定' : `現有 ${row.customer_products.length} 商品選擇`}
            </Text>
          </Table.Td>
          </Table.Tr>
        ));
        setRows(rs);
      }
    };

    setLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getData();
        setLoading(false);
        return null;
      }
      setLoading(false);
      redirect('/login', RedirectType.push);
      return null;
    });
  }, []);

  const handleCheckboxChange = (product_id: string) => {
    setChanged(true);
    setSelectedProducts(prevSelected => {
      if (prevSelected.includes(product_id)) {
        return prevSelected.filter(id => id !== product_id);
      }
      return [...prevSelected, product_id];
    });
  };

  const handlePriceChange = (product_id:string, newPrice:number) => {
    if (!selectedCustomer) {
      return;
    }
    setChanged(true);
    const newProducts = products.map((product) => {
      if (product.product_id === product_id) {
        if (product.customer_products.length > 0) {
          product.customer_products[0].price = newPrice;
        } else {
          product.customer_products = [{ customer_id: selectedCustomer, price: newPrice }];
        }
      }
      return product;
    });
    setProducts(newProducts);
  };

  const listProducts = () => {
    const rs = products.map((row) => (
      <Table.Tr key={row.product_id}>
        <Table.Td>
          <Checkbox
            id={row.product_id}
            checked={selectedProducts.includes(row.product_id)}
            onChange={() => {
              handleCheckboxChange(row.product_id);
            }}
          />
        </Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>
          <TextInput
            disabled={!selectedProducts.includes(row.product_id)}
            onChange={(event) => {
              handlePriceChange(row.product_id, Number(event.currentTarget.value));
            }}
            value={
              row.customer_products.length > 0 ? row.customer_products[0].price : row.unit_price
            }
          />
        </Table.Td>
      </Table.Tr>
    ));
    setProductRows(rs);
  };

  useEffect(() => {
    // cleanup
    setProducts([]);
    setSelectedProducts([]);
    setLoading(true);

    const getData = async () => {
      if (!selectedCustomer) return;
      const { data } = await supabase
      .from('products')
      .select(`
        *,
        customer_products:product_id (
          product_id,
          customer_id,
          price,
          is_available
        )
        `)
      .eq('customer_products.customer_id', selectedCustomer)
      .order('product_id', { ascending: false });
      if (data) {
        const rs:string[] = [];
        for (const product of data) {
          if (product.customer_products.length > 0 && product.customer_products[0].is_available) {
            rs.push(product.product_id);
          }
        }
        setSelectedProducts(rs);
        setProducts(data);
        setLoading(false);
      }
    };
    console.log(`Get data for ${selectedCustomer}`);
    getData();
  }, [selectedCustomer]);

  useEffect(() => {
    listProducts();
  }, [products, selectedProducts]);

  const saveChanges = async () => {
    if (!selectedCustomer) return;
    if (!changed) return;

    setLoading(true);
    await supabase.from('customer_products').delete().eq('customer_id', selectedCustomer);

    const records:CustomerProduct[] = [];

    for (const product of products) {
      if (selectedProducts.includes(product.product_id)) {
        if (product.customer_products.length > 0) {
          records.push({
            customer_id: selectedCustomer,
            product_id: product.product_id,
            price: product.customer_products[0].price,
            is_available: true,
          });
        } else {
          records.push({
            customer_id: selectedCustomer,
            product_id: product.product_id,
            price: product.unit_price,
            is_available: true,
          });
        }
      }
    }
    if (records.length > 0) {
      console.log(`insert ${JSON.stringify(records)}`);
      await supabase.from('customer_products').insert(records);
    }
    setChanged(false);
    setLoading(false);
    setOpened(false);
  };

  return (
    <MantineProvider>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />
      <Modal.Root
        opened={opened}
        onClose={() => { setOpened(false); }}
        centered
        size="lg"
        transitionProps={{ duration: 200, transition: 'fade' }}>
        <Modal.Overlay
          backgroundOpacity={0.55}
          blur={3} />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>銷售商品選擇</Modal.Title>
            <Button
              disabled={!changed}
              onClick={() => { saveChanges(); }}>儲存
            </Button>
          </Modal.Header>
          <Modal.Body>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>啟用</Table.Th>
                    <Table.Th>產品名稱</Table.Th>
                    <Table.Th>單價</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{productRows}</Table.Tbody>
              </Table>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
      <Table miw={700}>
        <Table.Thead className={classes.header}>
          <Table.Tr>
            <Table.Th>客戶代號</Table.Th>
            <Table.Th>客戶簡稱</Table.Th>
            <Table.Th>聯絡電話</Table.Th>
            <Table.Th>出貨地址</Table.Th>
            <Table.Th>未確認訂單數</Table.Th>
            <Table.Th>總收款額</Table.Th>
            <Table.Th>代付款項</Table.Th>
            <Table.Th>產品與銷售金額</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </MantineProvider>
  );
}
