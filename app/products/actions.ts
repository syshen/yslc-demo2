'use server';

import {
  jsonObjectFrom,
} from 'kysely/helpers/postgres';
import {
  db,
  UpdateProduct,
  NewProduct,
  Category,
  ProductWithCategory,
} from '@/utils/db';

export async function getAllProducts(): Promise<ProductWithCategory[]> {
  'use server';

  // const results = await db.selectFrom('products').selectAll().orderBy('product_id', 'asc').execute();
  const results = await db
    .selectFrom('products')
    .select((eb) => [
      'id',
      'name',
      'product_id',
      'base_unit',
      'base_unit_quantity',
      'is_active',
      'created_at',
      'spec',
      'gift_quantity',
      'stock_quantity',
      'stock_status',
      'unit',
      'unit_price',
      'category',
      'created_at',
      jsonObjectFrom(
        eb.selectFrom('categories')
          .selectAll()
          .whereRef('categories.id', '=', 'products.category')
      ).as('category_ref'),
    ])
    .orderBy('product_id', 'asc').execute();
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

export async function addNewCategory(name:string) {
  'use server';

  const results = await db.insertInto('categories').values({ name }).returningAll().execute();
  return results;
}

export async function getCategories():Promise<Category[]> {
  'use server';

  const results = await db.selectFrom('categories').selectAll().execute();
  return results;
}
