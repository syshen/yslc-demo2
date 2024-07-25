'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import {
  MantineProvider,
  Box,
  Group,
  Button,
  Modal,
  Table,
  Checkbox,
  TextInput,
  Text,
  Divider,
  Select,
  Loader,
  Pill,
  MultiSelect } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import classes from './customers.module.css';
import { Customer, Product, CustomerProduct } from '@/utils/types';

export default function CustomersPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productRows, setProductRows] = useState<JSX.Element[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>({ customer_id: '', name: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [editFlag, setEditFlag] = useState<boolean>(false);
  const router = useRouter();

  /*
    Customers
  */
  const getProductsByCustomer = async (customer_id:string) => {
    setProductLoading(true);
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
    .eq('customer_products.customer_id', customer_id)
    .order('product_id', { ascending: false });
    if (data) {
      const rs:string[] = [];
      for (const product of data) {
        if (product.customer_products.length > 0 && product.customer_products[0].is_available) {
          rs.push(product.product_id);
        }
      }
      setProducts(data);
    }
    setProductLoading(false);
  };

  const paymentOptions = (options: string | undefined) => {
    if (!options) {
      return '';
    }
    const label:{ [key: string] : string } = {
      monthlyPayment: '月結',
      bankTransfer: '銀行轉帳',
      payOnReceive: '貨到付款',
    };
    return options?.split(',').map((option) => <Pill key={option}>{label[option]}</Pill>);
  };

  useEffect(() => {
    const rs = customers.map((row) => (
      <Table.Tr key={row.customer_id}>
        <Table.Td>{row.customer_id}</Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>{row.customers ? (<Pill>{row.customers.name}</Pill>) : ''}</Table.Td>
        <Table.Td>{row.line_group_name}</Table.Td>
        <Table.Td>{[row.contact_phone_1, row.contact_phone_2].filter((x) => x).join(',')}</Table.Td>
        <Table.Td>{row.shipping_address}</Table.Td>
        <Table.Td>{paymentOptions(row.payment_options)}</Table.Td>
        <Table.Td w={60}>
          <Text
            td="underline"
            size="xs"
            className="cursor-pointer"
            onClick={() => {
              getProductsByCustomer(row.customer_id);
              setSelectedCustomer(row);
              setEditFlag(true);
              // setChanged(false);
              setOpened(true);
          }}>編輯
          </Text>
        </Table.Td>
      </Table.Tr>
    ));
    setRows(rs);
  }, [customers]);

  const getCustomers = async () => {
    const { data } = await supabase
    .from('customers')
    .select(`
      *,
      orders (order_id, customer_id, created_at, confirmed, confirmed_at, paid, paid_at, total, items),
      customers:parent_id (customer_id, name)
      `).order('created_at', { ascending: false });

    if (data) {
      setCustomers(data);
    }
  };

  const handleNewCustomer = () => {
    setEditFlag(false);
    setSelectedCustomer({
      customer_id: '',
      name: '',
    });
    // setSelectedProducts([]);
    setProductLoading(true);
    setOpened(true);
    const getData = async () => {
      const { data } = await supabase
      .from('products')
      .select('*')
      .order('product_id', { ascending: false });
      if (data) {
        setProducts(data);
        setProductLoading(false);
      }
    };
    getData();
  };

  /* Initial load */
  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getCustomers();
        setLoading(false);
        return null;
      }
      setLoading(false);
      router.push('/login');
      return null;
    });
  }, []);

  const handleCheckboxChange = (product_id: string) => {
    // setChanged(true);
    setProducts(prevProducts => {
      const newProducts = prevProducts.map(product => {
        if (product.product_id === product_id) {
          if (product.customer_products && product.customer_products.length > 0) {
            product.customer_products[0].is_available = !product.customer_products[0].is_available;
          } else {
            product.customer_products = [
              { customer_id: selectedCustomer.customer_id,
                price: product.unit_price ? product.unit_price : 0,
                is_available: true,
              },
            ];
          }
        }
        return product;
      });
      return newProducts;
    });
  };

  const handlePriceChange = (product_id:string, newPrice:number) => {
    const newProducts = products.map((product) => {
      if (product.product_id === product_id) {
        if (product.customer_products && product.customer_products.length > 0) {
          product.customer_products[0].price = newPrice;
        } else {
          product.customer_products = [
            { customer_id: selectedCustomer.customer_id, price: newPrice, is_available: true },
          ];
        }
      }
      return product;
    });
    setProducts(newProducts);
  };

  /*
    Products
  */
  const isProductEnabled = (product: Product) => {
    if (product.customer_products &&
        product.customer_products.length > 0 &&
        product.customer_products[0].is_available) {
      return true;
    }
    return false;
  };

  const listProducts = () => {
    const rs = products.map((row) => (
      <Table.Tr key={row.product_id}>
        <Table.Td>
          <Checkbox
            id={row.product_id}
            checked={isProductEnabled(row)}
            onChange={() => {
              handleCheckboxChange(row.product_id);
            }}
          />
        </Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>
          <TextInput
            disabled={!isProductEnabled(row)}
            onChange={(event) => {
              handlePriceChange(row.product_id, Number(event.currentTarget.value));
            }}
            value={
              (row.customer_products && row.customer_products.length > 0)
                ? row.customer_products[0].price : row.unit_price
            }
          />
        </Table.Td>
      </Table.Tr>
    ));
    setProductRows(rs);
  };

  useEffect(() => {
    listProducts();
  }, [products]);

  const saveChanges = async () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.customer_id === '') return;

    // setLoading(true);
    await supabase.from('customers').update({
      customer_id: selectedCustomer!.customer_id.trim(),
      name: selectedCustomer!.name.trim(),
      parent_id: selectedCustomer!.parent_id,
      contact_phone_1:
        selectedCustomer!.contact_phone_1 ? selectedCustomer!.contact_phone_1.trim() : null,
      contact_phone_2:
        selectedCustomer!.contact_phone_2 ? selectedCustomer!.contact_phone_2.trim() : null,
      shipping_address:
        selectedCustomer!.shipping_address ? selectedCustomer!.shipping_address.trim() : null,
      payment_options: selectedCustomer!.payment_options,
    }).eq('customer_id', selectedCustomer.customer_id);
    await supabase.from('customer_products').delete().eq('customer_id', selectedCustomer.customer_id);

    // 沒有母公司, 或者本身就是母公司的我們才儲存產品變動
    if (!selectedCustomer.parent_id || selectedCustomer.parent_id === '') {
      const records:CustomerProduct[] = [];

      for (const product of products) {
        if (isProductEnabled(product)) {
          records.push({
            customer_id: selectedCustomer.customer_id,
            product_id: product.product_id,
            price: product.customer_products![0].price,
            is_available: true,
          });
        }
      }
      if (records.length > 0) {
        console.log(`insert ${JSON.stringify(records)}`);
        await supabase.from('customer_products').insert(records);
      }
    }
    // setChanged(false);
    // setLoading(false);
    setOpened(false);
    getCustomers();
  };

  const saveNewCustomer = async () => {
    console.log(selectedCustomer);
    await supabase.from('customers').insert({
      customer_id: selectedCustomer!.customer_id.trim(),
      name: selectedCustomer!.name.trim(),
      parent_id: selectedCustomer!.parent_id,
      contact_phone_1:
        selectedCustomer!.contact_phone_1 ? selectedCustomer!.contact_phone_1.trim() : null,
      contact_phone_2:
        selectedCustomer!.contact_phone_2 ? selectedCustomer!.contact_phone_2.trim() : null,
      shipping_address:
        selectedCustomer!.shipping_address ? selectedCustomer!.shipping_address.trim() : null,
      payment_options: selectedCustomer!.payment_options ? selectedCustomer!.payment_options : null,
    });

    const records:CustomerProduct[] = [];
    for (const product of products) {
      if (isProductEnabled(product)) {
        records.push({
          customer_id: selectedCustomer!.customer_id,
          product_id: product.product_id,
          price: product.customer_products![0].price,
          is_available: true,
        });
      }
    }
    if (records.length > 0) {
      console.log(`insert ${JSON.stringify(records)}`);
      await supabase.from('customer_products').insert(records);
    }

    setOpened(false);
    getCustomers();
  };

  const deleteCustomer = async () => {
    if (!selectedCustomer) return;
    await supabase.from('customers').delete().eq('customer_id', selectedCustomer.customer_id);
    setSelectedCustomer({ customer_id: '', name: '' });
    setOpened(false);
    getCustomers();
  };

  const clickSave = () => {
    if (editFlag) {
      saveChanges();
    } else {
      saveNewCustomer();
    }
  };

  const pageLoading = () => (
    <Box className="flex justify-center">
      <Loader color="blue" type="dots" className="py-5"></Loader>
    </Box>
  );

  return (
    <MantineProvider>
      <Notifications />
      { loading ? pageLoading() :
      <>
      <Modal
        size="xl"
        opened={opened}
        title={editFlag ? '編輯客戶' : '新增客戶'}
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => { setOpened(false); }}>
          <TextInput
            label="客戶編號"
            required
            value={selectedCustomer!.customer_id}
            onChange={(event) => {
              setSelectedCustomer({ ...selectedCustomer!, customer_id: event.currentTarget.value });
            }} />
          <Select
            label="母公司編號"
            clearable
            value={selectedCustomer!.parent_id}
            onChange={(value) => {
              setSelectedCustomer({ ...selectedCustomer!, parent_id: value! });
            }}
            data={
              customers.map(customer => ({
                label: `${customer.customer_id} - ${customer.name}`,
                value: customer.customer_id,
              }))}
          />
          <TextInput
            label="客戶名稱"
            required
            value={selectedCustomer!.name}
            onChange={(event) => {
              setSelectedCustomer({ ...selectedCustomer!, name: event.currentTarget.value });
            }} />
          <MultiSelect
            label="付款方式"
            disabled={selectedCustomer && selectedCustomer.parent_id !== undefined
              && selectedCustomer.parent_id !== null && selectedCustomer.parent_id.length !== 0}
            value={selectedCustomer!.payment_options?.split(',')}
            data={[
              { label: '月結', value: 'monthlyPayment' },
              { label: '貨到付款', value: 'payOnReceive' },
              { label: '轉帳', value: 'bankTransfer' },
            ]}
            onChange={(values) =>
              setSelectedCustomer({ ...selectedCustomer!, payment_options: values.join(',') })
            } />
          <TextInput
            label="聯絡電話"
            value={selectedCustomer!.contact_phone_1}
            onChange={(event) => {
              setSelectedCustomer({
                ...selectedCustomer!,
                contact_phone_1: event.currentTarget.value,
              });
            }} />
          <TextInput
            label="出貨地址"
            value={selectedCustomer!.shipping_address}
            onChange={(event) => {
              setSelectedCustomer({
                ...selectedCustomer!,
                shipping_address: event.currentTarget.value,
              });
            }} />
          <Divider my="xl" />
          { (selectedCustomer && selectedCustomer.parent_id && selectedCustomer.parent_id !== '') ?
            <Text>請修改母公司的產品列表</Text>
          : productLoading ?
            <Box className="flex justify-center">
              <Loader color="blue" type="dots" className="py-5"></Loader>
            </Box> :
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
          }
          <Group>
            <Button
              mt="xl"
              onClick={() => { clickSave(); }}
            >
              { editFlag ? '儲存變動' : '新增客戶' }
            </Button>
            <Button
              mt="xl"
              color="red"
              className={editFlag ? '' : 'invisible'}
              onClick={() => { deleteCustomer(); }}
            >
              刪除客戶
            </Button>
          </Group>
      </Modal>
      <Box className="shadow-sm">
        <header>
          <Group justify="flex-end" className="py-3 pr-4">
            <Button
              onClick={() => handleNewCustomer()}
            >新增客戶
            </Button>
          </Group>
        </header>
      </Box>
      <Table.ScrollContainer minWidth={700}>
        <Table miw={700} highlightOnHover>
          <Table.Thead className={classes.header}>
            <Table.Tr>
              <Table.Th>客戶代號</Table.Th>
              <Table.Th>客戶簡稱</Table.Th>
              <Table.Th>母公司</Table.Th>
              <Table.Th>Line群</Table.Th>
              <Table.Th>聯絡電話</Table.Th>
              <Table.Th>出貨地址</Table.Th>
              <Table.Th>結帳方式</Table.Th>
              <Table.Th> </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      </>
      }
    </MantineProvider>
  );
}
