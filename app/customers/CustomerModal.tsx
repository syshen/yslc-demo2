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
import { User } from '@supabase/supabase-js';
import {
  getProductsByCustomer,
  getAllProducts,
  deleteCustomerByCustomerID,
  updateCustomer,
  updateCustomerProducts,
  addNewCustomer,
} from './actions';
import { createClient } from '../../utils/supabase/client';
import {
  Customer,
  NewCustomerProducts,
  ProductWithCustomPrice,
} from '@/utils/db';
import { logger, LogAction } from '@/utils/logger';

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
  const [loginUser, setLoginUser] = useState<User>();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customer);
  const [products, setProducts] = useState<ProductWithCustomPrice[]>([]);
  const [productRows, setProductRows] = useState<JSX.Element[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  /*
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
  */
  const isProductEnabled = (product: ProductWithCustomPrice) => {
    if (product.custom_price &&
        product.custom_price.is_available) {
      return true;
    }
    return false;
  };

  const handleCheckboxChange = (product_id: string) => {
    // setChanged(true);
    setProducts(prevProducts => {
      const newProducts = prevProducts.map(product => {
        if (product.product_id === product_id) {
          if (product.custom_price) {
            product.custom_price.is_available = !product.custom_price.is_available;
          } else if (selectedCustomer) {
            product.custom_price = {
                is_available: true,
                price: null,
                product_id: product.product_id,
              };
          }
        }
        return product;
      });
      return newProducts;
    });
  };

  const handlePriceChange = (product_id:string, newPrice:number | undefined) => {
    const newProducts = products.map((product) => {
      if (product.product_id === product_id) {
        if (product.custom_price) {
          product.custom_price.price = newPrice || null;
        } else if (selectedCustomer) {
          product.custom_price =
            {
              price: newPrice || null,
              is_available: true,
              product_id: product.product_id,
            };
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
            id={row.product_id?.toString()}
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
              (row.custom_price)
                ? (row.custom_price.price || undefined) : undefined
            }
          />
        </Table.Td>
      </Table.Tr>
    ));
    setProductRows(rs);
  };

  const deleteCustomer = async () => {
    try {
      if (selectedCustomer === null || selectedCustomer.customer_id.length === 0) return;
      setLoading(true);
      await deleteCustomerByCustomerID(selectedCustomer.customer_id);
      // await supabase.from('customers').delete().eq('customer_id', selectedCustomer.customer_id);
      setSelectedCustomer(null);
      setLoading(false);
      // setProducts([]);
      // setProductRows([]);
      logger.info(`Delete customer: ${selectedCustomer.customer_id}`, {
        action: LogAction.DELETE_CUSTOMERS,
        user: {
          user_id: loginUser?.id || '',
          email: loginUser?.email || '',
        },
        customer: selectedCustomer,
      });
      if (onChange) {
        onChange();
      }
    } catch (error) {
      console.error(error);
      Notifications.show({ message: '刪除失敗', color: 'red' });
    }
  };

  const saveChanges = async () => {
    if (selectedCustomer === null || selectedCustomer.customer_id === '') return;

    // setLoading(true);
    await updateCustomer(selectedCustomer.customer_id, {
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
    });

    // 沒有母公司, 或者本身就是母公司的我們才儲存產品變動
    if (!selectedCustomer.parent_id || selectedCustomer.parent_id === '') {
      const records:NewCustomerProducts[] = [];

      for (const product of products) {
        if (isProductEnabled(product)) {
          records.push({
            customer_id: selectedCustomer.customer_id,
            product_id: product.product_id,
            price: product.custom_price?.price,
            is_available: true,
          });
        }
      }
      await updateCustomerProducts(selectedCustomer.customer_id, records);
    }
  };

  useEffect(() => {
    listProducts();
  }, [products]);

  useEffect(() => {
    setProducts([]);
    setProductRows([]);
    setSelectedCustomer(customer);
    if (customer) {
      setProductLoading(true);
      getProductsByCustomer(customer.customer_id).then((results) => {
        const rs:string[] = [];
        for (const product of results) {
          if (product.custom_price && product.custom_price.is_available) {
            rs.push(product.product_id);
          }
        }
        setProducts(results);

        setProductLoading(false);
      });
    } else {
      getAllProducts().then((results) => {
        setProducts(results as ProductWithCustomPrice[]);
        setProductLoading(false);
      });
      // getData();
    }
  }, [customer]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoginUser(user);
      }
    });
  }, []);

  const saveNewCustomer = async () => {
    const records:NewCustomerProducts[] = [];
    for (const product of products) {
      if (isProductEnabled(product)) {
        records.push({
          customer_id: selectedCustomer!.customer_id,
          product_id: product.product_id,
          price: product.custom_price?.price,
          is_available: true,
        });
      }
    }
    await addNewCustomer({
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
    }, records);
  };

  const clickSave = async () => {
    setLoading(true);
    if (customer) {
      try {
        await saveChanges();
        logger.info('Update customer', {
          action: LogAction.MODIFY_CUSTOMER,
          customer,
          user: {
            user_id: loginUser?.id || '',
            email: loginUser?.email || '',
          },
        });
      } catch (error) {
        Notifications.show({ message: '更新失敗', color: 'red' });
      }
    } else {
      try {
        await saveNewCustomer();
        logger.info('Add new customer', {
          action: LogAction.ADD_CUSTOMER,
          user: {
            user_id: loginUser?.id || '',
            email: loginUser?.email || '',
          },
        });
      } catch (error) {
        Notifications.show({ message: '新增失敗', color: 'red' });
      }
    }
    setLoading(false);
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
          // setProducts([]);
          // setProductRows([]);
          if (onClose) {
            onClose();
          }
        }}>
          <TextInput
            label="客戶編號"
            required
            value={selectedCustomer?.customer_id}
            onChange={(event) => {
              setSelectedCustomer({ ...selectedCustomer!, customer_id: event.currentTarget.value });
            }} />
          <Select
            label="母公司編號"
            clearable
            value={selectedCustomer?.parent_id}
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
            value={selectedCustomer?.name}
            onChange={(event) => {
              setSelectedCustomer({ ...selectedCustomer!, name: event.currentTarget.value });
            }} />
          <Select
            label="付款方式"
            disabled={selectedCustomer !== null && selectedCustomer.parent_id !== undefined
              && selectedCustomer.parent_id !== null && selectedCustomer.parent_id.length !== 0}
            value={selectedCustomer?.payment_options}
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
            value={selectedCustomer?.contact_phone_1 || ''}
            onChange={(event) => {
              setSelectedCustomer({
                ...selectedCustomer!, contact_phone_1: event.currentTarget.value,
              });
            }} />
          <TextInput
            label="出貨地址"
            value={selectedCustomer?.shipping_address || ''}
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
              loading={loading}
              onClick={async () => { await clickSave(); }}
            >
              { customer ? '儲存變動' : '新增客戶' }
            </Button>
            <Button
              mt="xl"
              color="red"
              loading={loading}
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
