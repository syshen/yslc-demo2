'use client';

import React, { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import {
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
} from '@mantine/core';
import { createClient } from '../../utils/supabase/client';
import { Customer, Product, CustomerProduct } from '../../utils/types';

export function CustomerModal(
  { opened, onClose, onChange, customer, customers }:
  { opened: boolean,
    onClose: () => void,
    onChange: () => void,
    customer: Customer | null,
    customers: Customer[]
  }
) {
  const supabase = createClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customer || { customer_id: '', name: '' });
  const [products, setProducts] = useState<Product[]>([]);
  const [productRows, setProductRows] = useState<JSX.Element[]>([]);
  const [productLoading, setProductLoading] = useState(false);

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
  const isProductEnabled = (product: Product) => {
    if (product.customer_products &&
        product.customer_products.length > 0 &&
        product.customer_products[0].is_available) {
      return true;
    }
    return false;
  };

  const handleCheckboxChange = (product_id: number) => {
    // setChanged(true);
    setProducts(prevProducts => {
      const newProducts = prevProducts.map(product => {
        if (product.product_id === product_id) {
          if (product.customer_products && product.customer_products.length > 0) {
            product.customer_products[0].is_available = !product.customer_products[0].is_available;
          } else {
            product.customer_products = [
              { customer_id: selectedCustomer.customer_id,
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

  const handlePriceChange = (product_id:number, newPrice:number | undefined) => {
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

  const listProducts = () => {
    const rs = products.map((row) => (
      <Table.Tr key={row.product_id}>
        <Table.Td>
          <Checkbox
            id={row.product_id.toString()}
            checked={isProductEnabled(row)}
            onChange={() => {
              handleCheckboxChange(row.product_id);
            }}
          />
        </Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>{row.unit_price}</Table.Td>
        <Table.Td>
          <TextInput
            disabled={!isProductEnabled(row)}
            placeholder="不填則為預設牌價"
            onChange={(event) => {
              const value = (event.currentTarget.value.length === 0)
                ? undefined : Number(event.currentTarget.value);
              handlePriceChange(row.product_id, value);
            }}
            value={
              (row.customer_products && row.customer_products.length > 0)
                ? row.customer_products[0].price : undefined
            }
          />
        </Table.Td>
      </Table.Tr>
    ));
    setProductRows(rs);
  };

  const deleteCustomer = async () => {
    if (selectedCustomer.customer_id.length === 0) return;
    await supabase.from('customers').delete().eq('customer_id', selectedCustomer.customer_id);
    setSelectedCustomer({ customer_id: '', name: '' });
    setProducts([]);
    setProductRows([]);
    if (onChange) {
      onChange();
    }
  };

  const saveChanges = async () => {
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
  };

  useEffect(() => {
    listProducts();
  }, [products]);

  useEffect(() => {
    setSelectedCustomer(customer || { customer_id: '', name: '' });
    if (customer) {
      getProductsByCustomer(customer.customer_id);
    } else {
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
    }
  }, [customer]);

  const saveNewCustomer = async () => {
    const resp = await supabase.from('customers').insert({
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
    if (resp.error) {
      Notifications.show({
        message: `新增失敗: ${resp.error.message}`,
        color: 'red',
      });
    }

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
  };

  const clickSave = async () => {
    if (customer) {
      await saveChanges();
    } else {
      await saveNewCustomer();
    }
    setProducts([]);
    setProductRows([]);
    if (onChange) {
      onChange();
    }
  };

  return (
    <>
      <Modal
        size="xl"
        opened={opened}
        title={customer ? '編輯客戶' : '新增客戶'}
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => {
          setProducts([]);
          setProductRows([]);
          if (onClose) {
            onClose();
          }
        }}>
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
              customers.map(c => ({
                label: `${c.customer_id} - ${c.name}`,
                value: c.customer_id,
              }))}
          />
          <TextInput
            label="客戶名稱"
            required
            value={selectedCustomer!.name}
            onChange={(event) => {
              setSelectedCustomer({ ...selectedCustomer!, name: event.currentTarget.value });
            }} />
          <Select
            label="付款方式"
            disabled={selectedCustomer !== null && selectedCustomer.parent_id !== undefined
              && selectedCustomer.parent_id !== null && selectedCustomer.parent_id.length !== 0}
            value={selectedCustomer!.payment_options}
            data={[
              { label: '月結', value: 'monthlyPayment' },
              { label: '貨到付款', value: 'payOnReceive' },
              { label: '轉帳', value: 'bankTransfer' },
            ]}
            onChange={(value) => {
              setSelectedCustomer({ ...selectedCustomer!, payment_options: value! });
            }
            } />
          <TextInput
            label="聯絡電話"
            value={selectedCustomer!.contact_phone_1}
            onChange={(event) => {
              setSelectedCustomer({
                ...selectedCustomer!, contact_phone_1: event.currentTarget.value,
              });
            }} />
          <TextInput
            label="出貨地址"
            value={selectedCustomer!.shipping_address}
            onChange={(event) => {
              setSelectedCustomer({
                ...selectedCustomer!, shipping_address: event.currentTarget.value,
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
                  <Table.Th>牌價</Table.Th>
                  <Table.Th>特殊價</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{productRows}</Table.Tbody>
            </Table>
          }
          <Group>
            <Button
              mt="xl"
              onClick={async () => { await clickSave(); }}
            >
              { customer ? '儲存變動' : '新增客戶' }
            </Button>
            <Button
              mt="xl"
              color="red"
              className={customer ? '' : 'invisible'}
              onClick={async () => { await deleteCustomer(); }}
            >
              刪除客戶
            </Button>
          </Group>
      </Modal>
    </>
  );
}
