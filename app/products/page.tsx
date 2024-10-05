'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { nprogress } from '@mantine/nprogress';
import {
  MantineProvider,
  Box,
  Group,
  Button,
  Table,
  Text,
  Checkbox,
  TextInput,
  // Loader,
  Select,
} from '@mantine/core';
import '@mantine/notifications/styles.css';
import { createClient } from '@/utils/supabase/client';
import classes from './products.module.css';
import { ProductWithCategory, Category } from '@/utils/db';
import { getAllProducts, updateProduct, getCategories } from './actions';
import { BatchImportButton } from '@/components/buttons/BatchImportButton';
import { ProductModal } from './ProductModal';

export default function ProductsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [changed, setChanged] = useState<boolean>(false);
  const [opened, setOpened] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [changedProductIds, setChangedProductIds] = useState<number[]>([]);

  const changeStockStatus = async (product:ProductWithCategory) => {
    let c = false;
    const ps = products.map((p) => {
      if (p.id === product.id) {
        p.is_active = !p.is_active;
        c = true;
      }
      return p;
    });
    if (c) {
      setProducts(ps);
      setChangedProductIds([...changedProductIds, product.id]);
      setChanged(true);
    }
  };

  const changeStockQuantity = async (product:ProductWithCategory, value:string) => {
    let c = false;
    const val = value === '' ? null : parseInt(value, 10);
    const ps = products.map((p) => {
      if (p.id === product.id) {
        p.stock_quantity = val;
        c = true;
      }
      return p;
    });
    if (c) {
      setProducts(ps);
      setChangedProductIds([...changedProductIds, product.id]);
      setChanged(true);
    }
  };

  const saveChanges = async () => {
    // setLoading(true);
    setChanged(false);
    for (const pid of changedProductIds) {
      const product = products.find((p) => p.id === pid);
      if (product) {
        try {
          delete (product as ProductWithCategory).category_ref;
          await updateProduct(pid, product);
        } catch (error) {
          console.error(error);
          Notifications.show({ message: '更新失敗', color: 'red' });
        }
      }
    }
    setChangedProductIds([]);
    // setLoading(false);
  };

  const listProducts = async () => {
    const rs = products
      .filter((p) => selectedCategory ? p.category === parseInt(selectedCategory, 10) : true)
      .map((row:any, idx) => (
      <Table.Tr key={idx}>
        <Table.Td>
          {row.name}
        </Table.Td>
        <Table.Td>
          {row.product_id}
        </Table.Td>
        <Table.Td>
          {row.category_ref?.name}
        </Table.Td>
        <Table.Td>
          {row.unit}
        </Table.Td>
        <Table.Td>
          {row.unit_price}
        </Table.Td>
        <Table.Td>
          {row.base_unit_quantity} {row.base_unit} {row.gift_quantity ? (<Text size="xs">加贈 {row.gift_quantity} {row.base_unit} </Text>) : '' }
        </Table.Td>
        <Table.Td>
          {Number(Math.round(row.unit_price * row.base_unit_quantity)).toLocaleString()}
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
              // setEditFlag(true);
              setOpened(true);
          }}>編輯
          </Text>
        </Table.Td>
      </Table.Tr>
    ));
    setRows(rs);
    console.log('list products, timestamp:', new Date().getTime());
  };

  useEffect(() => {
    listProducts();
  }, [selectedCategory]);

  const getProducts = () => {
    nprogress.start();
    getAllProducts().then((results) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('products', JSON.stringify(results));
      }
      setProducts(results);
      nprogress.complete();
    }).catch((error) => {
      nprogress.complete();
      console.error(error);
      Notifications.show({ message: '讀取失敗', color: 'red' });
    });
  };

  useEffect(() => {
    listProducts();
  }, [products]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const localProducts = localStorage.getItem('products');
        if (localProducts) {
          setProducts(JSON.parse(localProducts));
        }
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getProducts();
        getCategories().then((results) => {
          setCategories(results);
        });
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('user');
          localStorage.removeItem('products');
        }
        router.push('/login');
      }
    });
  }, []);

  return (
    <MantineProvider>
      <Notifications />
      <ProductModal
        opened={opened}
        onClose={() => { setOpened(false); setSelectedProduct(null); }}
        onChange={async () => {
          await getProducts();
          setSelectedProduct(null);
          await setOpened(false);
        }}
        product={selectedProduct}
      />
      {/* { loading ? pageLoading() : */}
      <Box>
        <Box className="shadow-sm">
          <header>
            <Group justify="space-between">
              <Select
                clearable
                placeholder="選擇類別"
                data={categories.map((c) => ({ label: c.name, value: String(c.id) }))}
                onChange={(c) => { setSelectedCategory(c); }}
              />

              <Group justify="flex-end" className="py-3 pr-4">
                <Button
                  disabled={!changed}
                  onClick={() => saveChanges()}
                >
                  套用變更
                </Button>
                <Button
                  onClick={() => { setSelectedProduct(null); setOpened(true); }}
                >
                  新增產品
                </Button>
                <BatchImportButton
                  label="匯入商品"
                  description="匯入資料的格式必須是 CSV，你可以由 Excel 去轉換成 CSV。裡面要包含一些必要的欄位，像是 品名、品號、單位、標準售價、規格。"
                  uploadPath="yslc/products/upload"
                  onImport={() => {
                    getProducts();
                  }}
                />
              </Group>
            </Group>
          </header>
        </Box>
        <Table.ScrollContainer minWidth={700}>
          <Table miw={700} highlightOnHover>
            <Table.Thead className={classes.header}>
              <Table.Tr>
                <Table.Th>商品名稱</Table.Th>
                <Table.Th>品號</Table.Th>
                <Table.Th>類別</Table.Th>
                <Table.Th>銷售單位</Table.Th>
                <Table.Th>單價</Table.Th>
                <Table.Th>規格</Table.Th>
                <Table.Th>銷售牌價</Table.Th>
                <Table.Th>銷售中</Table.Th>
                <Table.Th>剩餘庫存</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>
      {/* } */}
    </MantineProvider>
  );
}
