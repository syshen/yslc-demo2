'use client';

import { redirect, RedirectType } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Table } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import classes from './customers.module.css';
import { Order, OrderItem } from '@/utils/types';
// import { Customer } from '@/utils/types';

export default function OrdersPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from('customers')
        .select(`
        *,
        orders (order_id, customer_id, created_at, confirmed, confirmed_at, paid, paid_at, total, items)
        `).order('created_at', { ascending: false });

      if (data) {
        const rs = data.map((row) => (
          <Table.Tr key={row.customer_id}>
            <Table.Td>{row.customer_id}</Table.Td>
            <Table.Td>{row.name}</Table.Td>
            <Table.Td>{row.contact_phone_1}, {row.contact_phone_2}</Table.Td>
            <Table.Td>{row.shipping_address}</Table.Td>
            <Table.Td>
            {
              row.orders
              .filter((order:Order) => (order.confirmed && !order.paid)).length
              }
            </Table.Td>
            <Table.Td>
            {
              row.orders
              .filter((order:Order) => order.paid)
              .reduce((accuValue:number, order:Order) => accuValue + order.total, 0)
              .toLocaleString()
              }
            </Table.Td>
            <Table.Td>
              {
              row.orders
              .filter((order:Order) => (order.confirmed && !order.paid))
              .reduce((accuValue:number, order:Order) => accuValue + order.total, 0)
              .toLocaleString()
              }
            </Table.Td>
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
  });
  return (
    <Table miw={700}>
      <Table.Thead className={classes.header}>
        <Table.Tr>
          <Table.Th>Customer ID</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Phone</Table.Th>
          <Table.Th>Shipping Address</Table.Th>
          <Table.Th>Pending Orders</Table.Th>
          <Table.Th>Total Fee Received</Table.Th>
          <Table.Th>Outstanding Payment</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
