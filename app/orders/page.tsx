'use client';

import { redirect, RedirectType } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { MantineProvider, Table, Checkbox, Select, Group, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/notifications/styles.css';
import { createClient } from '@/utils/supabase/client';
import classes from './orders.module.css';
import { Order, OrderItem } from '@/utils/types';
import { confirmOrder } from '@/app/actions';

export default function OrdersPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value:string, label:string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [refreshTimes, setRefreshTimes] = useState(0);

  const copy = (text:string) => {
    navigator.clipboard.writeText(text);
    Notifications.show({
      message: `Copied ${text} to clipboard`,
      color: 'teal',
    });
  };
  const paymentOption = (order:Order) => {
    if (order.payment_option === 'bankTransfer') {
      if (order.account_number) {
        return `銀行轉帳，帳號後五碼: ${order.account_number}`;
      }
      return '銀行轉帳，尚未提供帳號';
    }
    return '貨到付款';
  };

  const getCustomers = async () => {
    const { data } = await supabase.from('customers')
      .select(`
        customer_id, 
        name
      `);

    if (data) {
      const rs = data.map((row) => ({
          value: row.customer_id,
          label: row.name,
      }));
      setCustomerOptions(rs);
    }
  };

  const getData = async (
    includeCanceled:boolean = false,
    includePaid:boolean = false,
    customer_id: string | null = null
  ) => {
    let func = supabase
      .from('orders')
      .select(`
        *,
        customers (customer_id, name)
      `);
    if (!includeCanceled) {
      func = func.eq('cancelled', false);
    }
    if (!includePaid) {
      func = func.eq('paid', false);
    }
    if (selectedCustomer && selectedCustomer !== '') {
      func.eq('customer_id', customer_id);
    }
    func = func.order('created_at', { ascending: false });

    const { data } = await func;

    if (data) {
      const rs = data.map((row:any) => {
        if (!row.items) {
          return [];
        }
        return row.items.map((item:OrderItem, idx:number) => (
          <Table.Tr key={idx}>
            <Table.Td className={row.cancelled ? 'line-through' : ''}>
              {new Date(row.created_at).toLocaleDateString()}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(row.order_id); }}
            >
              {row.order_id}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(row.customers.customer_id); }}
            >
              {row.customers.customer_id}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(row.customers.name); }}
            >
              {row.customers.name}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(item.id.toString()); }}
            >
              {item.id}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(item.item); }}
            >
              {item.item}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(item.quantity.toString()); }}
            >
              {item.quantity}
            </Table.Td>
            <Table.Td
              className={row.cancelled ? 'line-through' : ''}
              onClick={() => { copy(item.unit_price.toString()); }}
            >
              {item.unit_price.toLocaleString()}
            </Table.Td>
            <Table.Td className={row.cancelled ? 'line-through' : ''}>{paymentOption(row)}</Table.Td>
            <Table.Td className={row.cancelled ? 'line-through' : ''}>{Number(row.total).toLocaleString()}</Table.Td>
            <Table.Td className={row.cancelled ? 'line-through' : ''}>{paymentStatus(row)}</Table.Td>
          </Table.Tr>
        ));
      });
      setRows(rs);
    }
  };

  const [loading, { toggle }] = useDisclosure();

  const doVerifyOrder = async (order_id:string) => {
    toggle();
    await confirmOrder(order_id);
    setRefreshTimes(refreshTimes + 1);
  };

  const paymentStatus = (order:Order) => {
    if (order.paid === false) {
      if (order.payment_option === 'bankTransfer') {
        if (order.account_number && order.account_number.length > 1) {
          return (
          <Button loading={loading} onClick={() => doVerifyOrder(order.order_id)}>確認付款完成</Button>);
        }
      }
      return '待付款';
    }
    return '已付款';
  };

  const [cancelledChecked, setCancelledChecked] = useState(false);
  const [paidChecked, setPaidChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getCustomers();
        return getData(cancelledChecked, paidChecked, selectedCustomer);
      }
      redirect('/login', RedirectType.push);
      return null;
    });
  }, [cancelledChecked, paidChecked, selectedCustomer, refreshTimes]);

  return (
    <MantineProvider>
      <Notifications />
      <div className="flex flex-row m-5 content-center justify-between">
        <Group gap="md">
          <div className="pr-5">篩選條件:</div>
          <Checkbox
            size="md"
            checked={cancelledChecked}
            label="已取消訂單"
            onChange={(event) => setCancelledChecked(event.currentTarget.checked)}>
          </Checkbox>
          <Checkbox
            size="md"
            checked={paidChecked}
            label="已付款訂單"
            onChange={(event) => setPaidChecked(event.currentTarget.checked)}>
          </Checkbox>
        </Group>
        <Select
          size="md"
          data={customerOptions}
          clearable
          placeholder="選擇客戶"
          onChange={(customer_id) => { setSelectedCustomer(customer_id); }}
        />
      </div>
      <Table miw={700}>
        <Table.Thead className={classes.header}>
          <Table.Tr>
            <Table.Th>銷貨日期</Table.Th>
            <Table.Th>訂單編號</Table.Th>
            <Table.Th>客戶代號</Table.Th>
            <Table.Th>客戶簡稱</Table.Th>
            <Table.Th>品號</Table.Th>
            <Table.Th>品名</Table.Th>
            <Table.Th>銷貨數量</Table.Th>
            <Table.Th>訂單單價</Table.Th>
            <Table.Th>付款方式</Table.Th>
            <Table.Th>訂單總額</Table.Th>
            <Table.Th>付款狀態</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </MantineProvider>
  );
}
