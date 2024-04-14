'use client';

import { redirect, RedirectType } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { MantineProvider, Table } from '@mantine/core';
import '@mantine/notifications/styles.css';
import { createClient } from '@/utils/supabase/client';
import classes from './orders.module.css';
import { OrderItem } from '@/utils/types';

export default function OrdersPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);

  const copy = (text:string) => {
    navigator.clipboard.writeText(text);
    Notifications.show({
      message: `Copied ${text} to clipboard`,
      color: 'teal',
    });
  };
  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
        *,
        customers (customer_id, name)
        `).order('created_at', { ascending: false });

      if (data) {
        const rs = data.map((row) =>
          row.items.map((item:OrderItem) => (
            <Table.Tr key={row.order_id}>
              <Table.Td>{new Date(row.created_at).toLocaleDateString()}</Table.Td>
              <Table.Td
                onClick={() => { copy(row.order_id); }}
              >
                {row.order_id}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(row.customers.customer_id); }}
              >
                {row.customers.customer_id}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(row.customers.name); }}
              >
                {row.customers.name}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(item.id.toString()); }}
              >
                {item.id}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(item.item); }}
              >
                {item.item}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(item.quantity.toString()); }}
              >
                {item.quantity}
              </Table.Td>
              <Table.Td
                onClick={() => { copy(item.unit_price.toString()); }}
              >
                {item.unit_price.toLocaleString()}
              </Table.Td>
              <Table.Td>{row.paid ? '線上付款' : '未付款'}</Table.Td>
              <Table.Td>{row.confirmed && row.paid ? 'Y' : 'N'}</Table.Td>
              <Table.Td>{Number(row.total).toLocaleString()}</Table.Td>
            </Table.Tr>
          ))
        );
        setRows(rs);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        return getData();
      }
      redirect('/login', RedirectType.push);
      return null;
    });
  }, []);

  return (
    <MantineProvider>
      <Notifications />
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
            <Table.Th>下單成功</Table.Th>
            <Table.Th>訂單總額</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </MantineProvider>
  );
}
