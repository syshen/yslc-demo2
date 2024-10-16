'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Shop } from './ShopPage';
import { getProductsBy, getCustomerBy, getOrderById, uniqueOrderIdentity } from './actions';
import { Order } from '@/utils/database';

interface Cart {
  [id:string]: number
}

export default async function ShopPage({ searchParams }:
{
  searchParams: { oid?: string, cid?: string, list?: string }
}) {
  if (searchParams.cid === undefined) {
    return notFound();
  }
  if (searchParams.oid === undefined) {
    return notFound();
  }
  const customer_id:string = searchParams.cid || '';
  let order_id:string = searchParams.oid || '';
  // list=1011:1,2003:2
  const productList = searchParams.list?.split(',').map((item) => ({
    id: item.split(':')[0],
    quantity: item.split(':')[1],
  }));
  const cart:Cart = {};
  if (productList) {
    for (const item of productList) {
      cart[String(item.id)] = parseInt(item.quantity, 10);
    }
  }

  const products = await getProductsBy(customer_id);
  const customer = await getCustomerBy(customer_id);
  if (customer === null || customer === undefined) {
    return notFound();
  }
  let order:Order | null | undefined = null;
  if (order_id === '') {
    const oid = await uniqueOrderIdentity();
    if (oid !== null) {
      order_id = oid;
      // setOrderId(oid);
    }
  } else {
    order = await getOrderById(order_id);
    if (order === null || order === undefined) {
      return notFound();
    }
  }

  return (
    <Suspense>
      <Shop
        customer_id={customer_id}
        order_id={order_id}
        carts={cart}
        products={products}
        order={order}
        customer={customer}
      />
    </Suspense>
  );
}
