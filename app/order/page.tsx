'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { OrderInfoPage } from './OrderInfoPage';
import { getOrderById } from './actions';
import { OrderView } from '@/utils/database';

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

export default async function OrderPage(
  { searchParams }:
  {
    searchParams: { 'liff.state'?: string, oid?: string }
  }) {
  let order_id = searchParams.oid;

  if (searchParams['liff.state'] !== undefined) {
    let state = searchParams['liff.state'];
    if (state.startsWith('?')) {
      state = state.substring(1);
    }
    const stateParams = decodeToDictionary(state);
    order_id = stateParams.oid || '';
  }

  if (!order_id) {
    return notFound();
  }
  const o = await getOrderById(order_id as string) as OrderView | null | undefined;
  if (o === null || o === undefined) {
    return notFound();
  }

  return (
    <Suspense><OrderInfoPage order_id={order_id as string} order={o} /></Suspense>
  );
}
