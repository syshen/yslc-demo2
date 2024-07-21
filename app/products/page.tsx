'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import {
  MantineProvider,
  Box,
  Group,
  Button,
  Table,
  Checkbox,
  TextInput,
  Loader,
} from '@mantine/core';
import '@mantine/notifications/styles.css';
import { createClient } from '@/utils/supabase/client';
import classes from './products.module.css';
import { Product } from '@/utils/types';

export default function ProductsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [changed, setChanged] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [changedProductIds, setChangedProductIds] = useState<string[]>([]);

  const changeStockStatus = async (product:Product) => {
    let c = false;
    const ps = products.map((p) => {
      if (p.product_id === product.product_id) {
        p.is_active = !p.is_active;
        c = true;
      }
      return p;
    });
    if (c) {
      setProducts(ps);
      setChangedProductIds([...changedProductIds, product.product_id]);
      setChanged(true);
    }
  };

  const changeStockQuantity = async (product:Product, value:string) => {
    let c = false;
    const val = value === '' ? null : parseInt(value, 10);
    const ps = products.map((p) => {
      if (p.product_id === product.product_id) {
        p.stock_quantity = val;
        c = true;
      }
      return p;
    });
    if (c) {
      setProducts(ps);
      setChangedProductIds([...changedProductIds, product.product_id]);
      setChanged(true);
    }
  };

  const changeUnitPrice = (product:Product, value:string) => {
    let c = false;
    const val = value === '' ? null : parseInt(value, 10);
    const ps = products.map((p) => {
      if (p.product_id === product.product_id) {
        p.unit_price = Number(val);
        c = true;
      }
      return p;
    });
    if (c) {
      setProducts(ps);
      setChangedProductIds([...changedProductIds, product.product_id]);
      setChanged(true);
    }
  };

  const saveChanges = async () => {
    setLoading(true);
    setChanged(false);
    for (const product_id of changedProductIds) {
      const product = products.find((p) => p.product_id === product_id);
      if (product) {
        await supabase.from('products').update({
          unit_price: product.unit_price,
          is_active: product.is_active,
          stock_quantity: product.stock_quantity,
        }).eq('product_id', product_id);
      }
    }
    setChangedProductIds([]);
    setLoading(false);
  };

  const listProducts = async () => {
    const rs = products.map((row:any, idx) => (
      <Table.Tr key={idx}>
        <Table.Td>
          {row.name}
        </Table.Td>
        <Table.Td>
          {row.product_id}
        </Table.Td>
        <Table.Td>
          {row.unit}
        </Table.Td>
        <Table.Td>
          <TextInput
            w={80}
            value={row.unit_price}
            onChange={(event) => changeUnitPrice(row, event.currentTarget.value)}
          />
        </Table.Td>
        <Table.Td>
          <Checkbox
            checked={row.is_active}
            onChange={() => changeStockStatus(row)}
          />
        </Table.Td>
        <Table.Td>
          <TextInput
            className="w-60"
            placeholder="庫存數量，不填則為無限"
            value={row.stock_quantity === undefined || row.stock_quantity === null ? '' : row.stock_quantity}
            width={100}
            onChange={(event) => changeStockQuantity(row, event.currentTarget.value)} />
        </Table.Td>
      </Table.Tr>
    ));
    setRows(rs);
  };

  const getProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('product_id,name,spec,unit,unit_price,stock_quantity,is_active')
      .order('product_id', { ascending: true });
    if (data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    listProducts();
  }, [products]);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getProducts();
        setLoading(false);
      } else {
        setLoading(false);
        router.push('/login');
      }
    });
  }, []);

  const pageLoading = () => (
    <Box className="flex justify-center">
      <Loader color="blue" type="dots" className="py-5"></Loader>
    </Box>
  );

  return (
    <MantineProvider>
      <Notifications />
      { loading ? pageLoading() :
      <Box>
        <Box className="shadow-sm">
          <header>
            <Group justify="flex-end" className="py-3 pr-4">
              <Button
                disabled={!changed}
                onClick={() => saveChanges()}
              >
                套用變更
              </Button>
            </Group>
          </header>
        </Box>
        <Table.ScrollContainer minWidth={700}>
          <Table miw={700} highlightOnHover>
            <Table.Thead className={classes.header}>
              <Table.Tr>
                <Table.Th>商品名稱</Table.Th>
                <Table.Th>品號</Table.Th>
                <Table.Th>單位</Table.Th>
                <Table.Th>單位價格</Table.Th>
                <Table.Th>銷售中</Table.Th>
                <Table.Th>剩餘庫存</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>
      }
    </MantineProvider>
  );
}
