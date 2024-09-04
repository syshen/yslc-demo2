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

export async function updateProduct(product_id: string, values:UpdateProduct) {
  'use server';

  await db
    .updateTable('products')
    .set(values)
    .where('product_id', '=', product_id)
    .execute();
}

export async function deleteProduct(product_id: string) {
  'use server';

  await db
    .deleteFrom('products')
    .where('product_id', '=', product_id)
    .execute();
}
