'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { OrderInfoPage } from './OrderInfoPage';
import { getOrderById } from './actions';
import { OrderView } from '@/utils/database';

export default async function OrderPage(
  { searchParams }:
  {
    searchParams: { oid?: string }
  }) {
  const order_id = searchParams.oid;

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
