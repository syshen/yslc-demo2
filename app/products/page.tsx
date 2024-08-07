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
  Text,
  Modal,
  Select,
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
  const [opened, setOpened] = useState(false);
  const [editFlag, setEditFlag] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [loading, setLoading] = useState<boolean>(false);
  const [changedProductIds, setChangedProductIds] = useState<number[]>([]);

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
          {row.unit_price.toLocaleString()}
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
        <Table.Td w={80}>
          <Text
            td="underline"
            size="xs"
            className="cursor-pointer"
            onClick={() => {
              setSelectedProduct(row);
              setEditFlag(true);
              setOpened(true);
          }}>編輯
          </Text>
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

  const clickSave = async () => {
    if (!selectedProduct) {
      return;
    }
    if (selectedProduct.name.length === 0 || selectedProduct.product_id === 0) {
      Notifications.show({ message: '名稱和產品編號都不能為空', color: 'red' });
      return;
    }

    if (!editFlag) {
      // new
      const resp = await supabase.from('products').insert([
        {
          name: selectedProduct?.name || '',
          product_id: selectedProduct?.product_id || '',
          unit: selectedProduct?.unit || '',
          unit_price: selectedProduct?.unit_price || 0,
          gift_quantity: selectedProduct?.gift_quantity || 0,
          base_unit: selectedProduct?.base_unit || '',
          base_unit_quantity: selectedProduct?.base_unit_quantity || 0,
        },
      ]);
      if (resp.error) {
        Notifications.show({ message: `新增失敗: ${resp.error.message}`, color: 'red' });
      }
    } else {
      const resp = await supabase.from('products').update({
        name: selectedProduct?.name || '',
        unit: selectedProduct?.unit || '',
        unit_price: selectedProduct?.unit_price || 0,
        gift_quantity: selectedProduct?.gift_quantity || 0,
        base_unit: selectedProduct?.base_unit || '',
        base_unit_quantity: selectedProduct?.base_unit_quantity || 0,
      }).eq('product_id', selectedProduct?.product_id);
      if (resp.error) {
        Notifications.show({ message: `更新失敗: ${resp.error.message}`, color: 'red' });
      }
    }
    setOpened(false);
    setSelectedProduct(undefined);
    getProducts();
  };

  const deleteProduct = async () => {
    if (!selectedProduct || selectedProduct.product_id === 0) {
      return;
    }

    await supabase.from('products').delete().eq('product_id', selectedProduct?.product_id);
    setOpened(false);
    setSelectedProduct(undefined);
    getProducts();
  };

  return (
    <MantineProvider>
      <Notifications />
      <Modal
        size="xl"
        opened={opened}
        title={editFlag ? '編輯產品' : '新增產品'}
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => { setSelectedProduct(undefined); setOpened(false); }}>
        <TextInput
          label="名稱"
          required
          value={selectedProduct?.name}
          onChange={(event) => {
            setSelectedProduct({
              ...selectedProduct,
              name: event.currentTarget.value,
              product_id: selectedProduct?.product_id || 0,
              unit: selectedProduct?.unit || '',
              // unit_price: selectedProduct?.unit_price || 0,
            });
          }}
        />
        <TextInput
          label="品號"
          required
          disabled={editFlag}
          value={selectedProduct?.product_id}
          onChange={(event) => {
            setSelectedProduct({
              ...selectedProduct,
              product_id: parseInt(event.currentTarget.value),
              name: selectedProduct?.name || '',
              unit: selectedProduct?.unit || '',
              // unit_price: selectedProduct?.unit_price || 0,
            });
          }}
        />
        <Select
          label="銷售單位"
          required
          data={['箱', '組', '桶', '包']}
          value={selectedProduct?.unit}
          onChange={(value) => {
            setSelectedProduct({
              ...selectedProduct,
              unit: value || '',
              name: selectedProduct?.name || '',
              product_id: selectedProduct?.product_id || 0,
              // unit_price: selectedProduct?.unit_price || null,
            });
          }}
        />
        <TextInput
          label="規格說明"
          value={selectedProduct?.spec}
          onChange={(event) => {
            setSelectedProduct({
              ...selectedProduct,
              spec: event.currentTarget.value,
              name: selectedProduct?.name || '',
              product_id: selectedProduct?.product_id || 0,
              unit: selectedProduct?.unit || '',
            });
          }}
        />
        <Group>
          <TextInput
            label="ERP 數量"
            value={selectedProduct?.base_unit_quantity}
            onChange={(event) => {
              setSelectedProduct({
                ...selectedProduct,
                base_unit_quantity: Number(event.currentTarget.value),
                name: selectedProduct?.name || '',
                product_id: selectedProduct?.product_id || 0,
                unit: selectedProduct?.unit || '',
              });
            }}
          />
          <Select
            label="ERP 單位"
            value={selectedProduct?.base_unit}
            data={['罐', '箱', '桶', '瓶', '包']}
            onChange={(value) => {
              setSelectedProduct({
                ...selectedProduct,
                base_unit: value || '',
                name: selectedProduct?.name || '',
                product_id: selectedProduct?.product_id || 0,
                unit: selectedProduct?.unit || '',
              });
            }}
          />
          <TextInput
            label="贈品數量"
            value={selectedProduct?.gift_quantity}
            onChange={(event) => {
              setSelectedProduct({
                ...selectedProduct,
                gift_quantity: Number(event.currentTarget.value),
                name: selectedProduct?.name || '',
                product_id: selectedProduct?.product_id || 0,
                unit: selectedProduct?.unit || '',
              });
            }}
          />
        </Group>
        <TextInput
          label="牌價"
          required
          value={selectedProduct?.unit_price}
          onChange={(event) => {
            setSelectedProduct({
              ...selectedProduct,
              unit_price: Number(event.currentTarget.value),
              name: selectedProduct?.name || '',
              product_id: selectedProduct?.product_id || 0,
              unit: selectedProduct?.unit || '',
            });
          }}
        />
        <Group>
          <Button
            mt="xl"
            disabled={!selectedProduct}
            onClick={() => { clickSave(); }}
          >
            { editFlag ? '儲存變動' : '新增產品' }
          </Button>
          <Button
            mt="xl"
            color="red"
            className={editFlag ? '' : 'invisible'}
            onClick={() => { deleteProduct(); }}
          >
            刪除產品
          </Button>
        </Group>
      </Modal>
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
              <Button
                onClick={() => { setEditFlag(false); setOpened(true); }}
              >
                新增產品
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
                <Table.Th>銷售單位</Table.Th>
                <Table.Th>單位價格</Table.Th>
                <Table.Th>銷售中</Table.Th>
                <Table.Th>剩餘庫存</Table.Th>
                <Table.Th></Table.Th>
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
