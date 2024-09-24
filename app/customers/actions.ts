'use server';

import {
  jsonObjectFrom,
} from 'kysely/helpers/postgres';
import {
  db,
  UpdateCustomer,
  NewCustomer,
  NewCustomerProducts,
  ProductWithCustomPrice,
} from '@/utils/db';

export async function getAllCustomers() {
  'use server';

  const results = await db.selectFrom('customers')
    .leftJoin(
      (eb) => eb.selectFrom('customers').select(['customer_id', 'name']).as('stores'),
      (join) => join.onRef('stores.customer_id', '=', 'customers.parent_id')
    )
    .select([
      'customers.id',
      'customers.name',
      'customers.customer_id',
      'customers.line_group_name',
      'customers.line_id',
      'customers.shipping_address',
      'customers.contact_phone_1',
      'customers.contact_phone_2',
      'customers.payment_options',
      'customers.created_at',
      'customers.parent_id',
      'stores.name as parent_name'])
    .orderBy('created_at', 'desc')
    .execute();

  return results;
}

export async function getProductsByCustomer(customer_id: string):Promise<ProductWithCustomPrice[]> {
  'use server';

  const results = await db
    .selectFrom('products')
    .select((eb) => [
      'id',
      'product_id',
      'name',
      'spec',
      'unit',
      'unit_price',
      'is_active',
      'created_at',
      'stock_quantity',
      'stock_status',
      'base_unit',
      'base_unit_quantity',
      'gift_quantity',
      'category',
      jsonObjectFrom(
        eb.selectFrom('customer_products')
          .select(['id', 'unit_price', 'product_id', 'is_available'])
          .whereRef('customer_products.pid', '=', 'products.id')
          .where('customer_products.customer_id', '=', customer_id)
      ).as('custom_price'),
    ])
  .orderBy('product_id', 'desc').execute();

  return results;
}

export async function getAllProducts() {
  'use server';

  const results = await db.selectFrom('products').selectAll().orderBy('product_id', 'desc').execute();
  return results;
}

export async function deleteCustomerByCustomerID(customer_id: string) {
  'use server';

  await db.deleteFrom('customers').where('customer_id', '=', customer_id).execute();
}

export async function deleteCustomersIn(customer_ids: string[]) {
  'use server';

  await db.deleteFrom('customers').where('customer_id', 'in', customer_ids).execute();
}

export async function updateCustomer(customer_id:string, values:UpdateCustomer) {
  'use server';

  await db.updateTable('customers').set(values).where('customer_id', '=', customer_id).execute();
}

export async function updateCustomerProducts(customer_id: string, products:NewCustomerProducts[]) {
  'use server';

  await db.deleteFrom('customer_products').where('customer_id', '=', customer_id).execute();
  if (products.length > 0) {
    await db.insertInto('customer_products').values(products).execute();
  }
}

export async function addNewCustomer(values:NewCustomer, products:NewCustomerProducts[]) {
  'use server';

  await db.insertInto('customers').values(values).execute();
  if (products && products.length > 0) {
    await db.insertInto('customer_products').values(products).execute();
  }
}
