'use server';

import {
  db,
  UpdateProduct,
  NewProduct,
} from '@/utils/db';

export async function getAllProducts() {
  'use server';

  const results = await db.selectFrom('products').selectAll().orderBy('created_at', 'desc').execute();
  return results;
}

export async function addNewProduct(values:NewProduct) {
  'use server';

  await db.insertInto('products').values(values).execute();
}

export async function updateProduct(pid: number, values:UpdateProduct) {
  'use server';

  await db
    .updateTable('products')
    .set(values)
    .where('id', '=', pid)
    .execute();
}

export async function deleteProduct(pid: number) {
  'use server';

  await db
    .deleteFrom('products')
    .where('id', '=', pid)
    .execute();
}
