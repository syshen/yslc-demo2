'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Shop } from './ShopPage';
import { getProductsBy, getCustomerBy, getOrderById, uniqueOrderIdentity } from './actions';
import { Order } from '@/utils/database';

interface Cart {
  [id:string]: number
}

function decodeToDictionary(encodedStr: string): Record<string, string> {
  // Step 1: URL decode the input string
  const decodedStr = decodeURIComponent(encodedStr);

  // Step 2: Split the string by '&' to get key-value pairs
  const keyValuePairs = decodedStr.split('&');

  // Step 3: Iterate over each key-value pair and build the dictionary
  const dictionary: Record<string, string> = {};
  keyValuePairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      dictionary[key] = value;
    }
  });

  return dictionary;
}

export default async function ShopPage({ searchParams }:
{
  searchParams: { 'liff.state'?: string, oid?: string, cid?: string, list?: string }
}) {
  let customer_id:string = searchParams.cid || '';
  let order_id:string = searchParams.oid || '';
  let list:string = searchParams.list || '';

  if (searchParams['liff.state'] !== undefined) {
    const stateParams = decodeToDictionary(searchParams['liff.state'].replace('%3F', ''));
    customer_id = stateParams.cid || '';
    order_id = stateParams.oid || '';
    list = stateParams.list || '';
  }
  if (customer_id === '') {
    return notFound();
  }
  // list=1011:1,2003:2
  const productList = list.split(',').map((item) => ({
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
