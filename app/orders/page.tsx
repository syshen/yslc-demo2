'use client';

import { redirect, RedirectType } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Table } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import classes from './orders.module.css';
import { OrderItem } from '@/utils/types';

export default function OrdersPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const formatOrder = (order:OrderItem) => {
      let str = '';
      if (str.length > 0) {
        str += ', ';
      }
      if (order.quantity !== undefined) {
        str += `${order.item} x ${order.quantity}${order.unit}`;
      } else {
        str += `${order.item} x ${order.units}`;
      }

      return str;
    };
    const getData = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*').order('created_at', { ascending: false });

      if (data) {
        const rs = data.map((row) => (
          <Table.Tr key={row.order_id}>
            <Table.Td>{new Date(row.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>{row.confirmed ? 'Yes' : 'No'}</Table.Td>
            <Table.Td>{row.paid ? 'Yes' : 'No'}</Table.Td>
            <Table.Td>
              <ul>
                {row.items.map((item:OrderItem) => (
                  <li>{formatOrder(item)}</li>
                ))}
              </ul>
            </Table.Td>
            <Table.Td>{row.total}</Table.Td>
          </Table.Tr>
        ));
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
      <Table miw={700}>
        <Table.Thead className={classes.header}>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Confirmed</Table.Th>
            <Table.Th>Paid</Table.Th>
            <Table.Th>Orders</Table.Th>
            <Table.Th>Total fee</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
  );
}
