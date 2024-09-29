'use server';

import {
} from 'kysely/helpers/postgres';
import {
  db,
  OrderView,
} from '@/utils/db';

export const getOrderById = async (order_id:string):Promise<OrderView | null | undefined> => {
  'use server';

  const results = await db.selectFrom('view_orders').selectAll().where('order_id', '=', order_id).executeTakeFirst();
  return results;
};
