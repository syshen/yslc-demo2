'use client';

import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import {
  Group,
  Button,
  Modal,
  Select,
  TextInput,
} from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/utils/types';

export function ProductModal(
{ opened, onClose, onChange, product }:
{ opened: boolean,
    onClose: () => void,
    onChange: () => void,
    product: Product | null | undefined,
}) {
  const supabase = createClient();
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [loading, setLoading] = useState<boolean>(false);

  const clickSave = async () => {
    if (!selectedProduct) {
      return;
    }
    if (selectedProduct.name.length === 0 || selectedProduct.product_id === 0) {
      Notifications.show({ message: '名稱和產品編號都不能為空', color: 'red' });
      return;
    }

    setLoading(true);
    if (!product) {
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
      console.log(`更新: ${selectedProduct}`);
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
    setLoading(false);
    setSelectedProduct(undefined);
    if (onChange) {
      onChange();
    }
  };

  const deleteProduct = async () => {
    if (!selectedProduct || selectedProduct.product_id === 0) {
      return;
    }

    setLoading(true);
    await supabase.from('products').delete().eq('product_id', selectedProduct?.product_id);
    setLoading(false);
    setSelectedProduct(undefined);
    if (onChange) {
      onChange();
    }
  };

  useEffect(() => {
    setSelectedProduct(product || { product_id: 0, name: '', unit: '' });
  }, [product]);

  return (
    <Modal
      size="xl"
      opened={opened}
      title={product ? '編輯產品' : '新增產品'}
      transitionProps={{ duration: 200, transition: 'slide-down' }}
      onClose={() => { setSelectedProduct(undefined); onClose(); }}>
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
        disabled={product !== null}
        value={selectedProduct?.product_id}
        onChange={(event) => {
          setSelectedProduct({
            ...selectedProduct,
            product_id: parseInt(event.currentTarget.value, 10),
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
          loading={loading}
          disabled={!selectedProduct}
          onClick={() => { clickSave(); }}
        >
          { product ? '儲存變動' : '新增產品' }
        </Button>
        <Button
          mt="xl"
          color="red"
          loading={loading}
          className={product ? '' : 'invisible'}
          onClick={() => { deleteProduct(); }}
        >
          刪除產品
        </Button>
      </Group>
    </Modal>
  );
}