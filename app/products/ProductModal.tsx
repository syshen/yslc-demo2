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
// import { createClient } from '@/utils/supabase/client';
// import { Product } from '@/utils/types';
import { Product } from '@/utils/db';
import { addNewProduct, updateProduct, deleteProduct } from './actions';

export function ProductModal(
{ opened, onClose, onChange, product }:
{ opened: boolean,
    onClose: () => void,
    onChange: () => void,
    product: Product | null | undefined,
}) {
  // const supabase = createClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>();
  const [loading, setLoading] = useState<boolean>(false);

  const clickSave = async () => {
    if (!selectedProduct) {
      return;
    }
    if (selectedProduct.name.length === 0 || selectedProduct.product_id === null) {
      Notifications.show({ message: '名稱和產品編號都不能為空', color: 'red' });
      return;
    }

    setLoading(true);
    if (!product) {
      // new
      await addNewProduct({
        name: selectedProduct?.name || '',
        product_id: selectedProduct?.product_id || '',
        unit: selectedProduct?.unit || '',
        unit_price: selectedProduct?.unit_price || 0,
        gift_quantity: selectedProduct?.gift_quantity || 0,
        spec: selectedProduct?.spec || '',
        base_unit: selectedProduct?.base_unit || '',
        base_unit_quantity: selectedProduct?.base_unit_quantity || 0,
      });
      /*
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
      }*/
    } else {
      await updateProduct(selectedProduct.product_id, selectedProduct);
/*      const resp = await supabase.from('products').update({
        name: selectedProduct?.name || '',
        unit: selectedProduct?.unit || '',
        unit_price: selectedProduct?.unit_price || 0,
        gift_quantity: selectedProduct?.gift_quantity || 0,
        base_unit: selectedProduct?.base_unit || '',
        base_unit_quantity: selectedProduct?.base_unit_quantity || 0,
      }).eq('product_id', selectedProduct?.product_id);*/
/*      if (resp.error) {
        Notifications.show({ message: `更新失敗: ${resp.error.message}`, color: 'red' });
      }*/
    }
    setLoading(false);
    setSelectedProduct(undefined);
    if (onChange) {
      onChange();
    }
  };

  const deleteSelectedProduct = async () => {
    if (!selectedProduct) {
      return;
    }

    setLoading(true);
    await deleteProduct(selectedProduct.product_id);
    // await supabase.from('products').delete().eq('product_id', selectedProduct?.product_id);
    setLoading(false);
    setSelectedProduct(undefined);
    if (onChange) {
      onChange();
    }
  };

  useEffect(() => {
    setSelectedProduct(product);
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
          if (selectedProduct) {
            setSelectedProduct({
              ...selectedProduct,
              name: event.currentTarget.value,
            // product_id: selectedProduct?.product_id,
            // unit: selectedProduct?.unit || '',
            // unit_price: selectedProduct?.unit_price || 0,
            });
          } else {
            setSelectedProduct({
              name: event.currentTarget.value,
              id: 0,
              product_id: '',
              unit: null,
              unit_price: null,
              gift_quantity: null,
              base_unit: null,
              base_unit_quantity: null,
              spec: null,
              stock_quantity: null,
              stock_status: null,
              is_active: null,
              created_at: new Date(),
            });
          }
        }}
      />
      <TextInput
        label="品號"
        required
        disabled={product !== null}
        value={selectedProduct?.product_id}
        onChange={(event) => {
          if (selectedProduct) {
            setSelectedProduct({
              ...selectedProduct,
              product_id: event.currentTarget.value,
              // name: selectedProduct?.name || '',
              // unit: selectedProduct?.unit || '',
              // unit_price: selectedProduct?.unit_price || 0,
            });
          } else {
            setSelectedProduct({
              product_id: event.currentTarget.value,
              name: '',
              id: 0,
              unit: null,
              unit_price: null,
              gift_quantity: null,
              base_unit: null,
              base_unit_quantity: null,
              spec: null,
              stock_quantity: null,
              stock_status: null,
              is_active: null,
              created_at: new Date(),
            });
          }
        }}
      />
      <Select
        label="銷售單位"
        required
        data={['箱', '組', '桶', '包']}
        value={selectedProduct?.unit}
        onChange={(value) => {
          if (selectedProduct) {
            setSelectedProduct({
              ...selectedProduct,
              unit: value || '',
              // name: selectedProduct?.name || '',
              // product_id: selectedProduct?.product_id,
              // unit_price: selectedProduct?.unit_price || null,
            });
          } else {
            setSelectedProduct({
              unit: value || '',
              product_id: '',
              name: '',
              id: 0,
              unit_price: null,
              gift_quantity: null,
              base_unit: null,
              base_unit_quantity: null,
              spec: null,
              stock_quantity: null,
              stock_status: null,
              is_active: null,
              created_at: new Date(),
            });
          }
        }}
      />
      <TextInput
        label="規格說明"
        value={selectedProduct ? (selectedProduct.spec || undefined) : undefined}
        onChange={(event) => {
          if (selectedProduct) {
            setSelectedProduct({
              ...selectedProduct,
              spec: event.currentTarget.value,
              // name: selectedProduct?.name || '',
              // product_id: selectedProduct?.product_id,
              // unit: selectedProduct?.unit || '',
            });
          } else {
            setSelectedProduct({
              spec: event.currentTarget.value,
              product_id: event.currentTarget.value,
              name: '',
              id: 0,
              unit: null,
              unit_price: null,
              gift_quantity: null,
              base_unit: null,
              base_unit_quantity: null,
              stock_quantity: null,
              stock_status: null,
              is_active: null,
              created_at: new Date(),
            });
          }
        }}
      />
      <Group>
        <TextInput
          label="ERP 數量"
          value={selectedProduct ? (selectedProduct.base_unit_quantity || undefined) : undefined}
          onChange={(event) => {
            if (selectedProduct) {
              setSelectedProduct({
                ...selectedProduct,
                base_unit_quantity: Number(event.currentTarget.value),
                // name: selectedProduct?.name || '',
                // product_id: selectedProduct?.product_id,
                // unit: selectedProduct?.unit || '',
              });
            } else {
              setSelectedProduct({
                base_unit_quantity: Number(event.currentTarget.value),
                product_id: '',
                name: '',
                id: 0,
                unit: null,
                unit_price: null,
                gift_quantity: null,
                base_unit: null,
                spec: null,
                stock_quantity: null,
                stock_status: null,
                is_active: null,
                created_at: new Date(),
              });
            }
          }}
        />
        <Select
          label="ERP 單位"
          value={selectedProduct?.base_unit}
          data={['罐', '箱', '桶', '瓶', '包']}
          onChange={(value) => {
            if (selectedProduct) {
              setSelectedProduct({
                ...selectedProduct,
                base_unit: value || '',
                // name: selectedProduct?.name || '',
                // product_id: selectedProduct?.product_id,
                // unit: selectedProduct?.unit || '',
              });
            } else {
              setSelectedProduct({
                base_unit: value || '',
                product_id: '',
                name: '',
                id: 0,
                unit: null,
                unit_price: null,
                gift_quantity: null,
                base_unit_quantity: null,
                spec: null,
                stock_quantity: null,
                stock_status: null,
                is_active: null,
                created_at: new Date(),
              });
            }
          }}
        />
        <TextInput
          label="贈品數量"
          value={selectedProduct ? (selectedProduct.gift_quantity || undefined) : undefined}
          onChange={(event) => {
            if (selectedProduct) {
              setSelectedProduct({
                ...selectedProduct,
                gift_quantity: Number(event.currentTarget.value),
                // name: selectedProduct?.name || '',
                // product_id: selectedProduct?.product_id || '',
                // unit: selectedProduct?.unit || '',
              });
            } else {
              setSelectedProduct({
                gift_quantity: Number(event.currentTarget.value),
                product_id: '',
                name: '',
                id: 0,
                unit: null,
                unit_price: null,
                base_unit: null,
                base_unit_quantity: null,
                spec: null,
                stock_quantity: null,
                stock_status: null,
                is_active: null,
                created_at: new Date(),
              });
            }
          }}
        />
      </Group>
      <TextInput
        label="牌價"
        required
        value={selectedProduct ? (selectedProduct.unit_price || undefined) : undefined}
        onChange={(event) => {
          if (selectedProduct) {
            setSelectedProduct({
              ...selectedProduct,
              unit_price: Number(event.currentTarget.value),
              // name: selectedProduct?.name || '',
              // product_id: selectedProduct?.product_id || 0,
              // unit: selectedProduct?.unit || '',
            });
          } else {
            setSelectedProduct({
              unit_price: Number(event.currentTarget.value),
              product_id: event.currentTarget.value,
              name: '',
              id: 0,
              unit: null,
              gift_quantity: null,
              base_unit: null,
              base_unit_quantity: null,
              spec: null,
              stock_quantity: null,
              stock_status: null,
              is_active: null,
              created_at: new Date(),
            });
          }
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
          onClick={() => { deleteSelectedProduct(); }}
        >
          刪除產品
        </Button>
      </Group>
    </Modal>
  );
}
