// import { redirect } from 'next/navigation';
import { CalendarDaysIcon, CreditCardIcon, UserCircleIcon } from '@heroicons/react/20/solid';
import { createClient } from '@/utils/supabase/server';
import { Order, OrderState } from '@/utils/types';

export default async function PaymentPage({ params }: { params: { order_id: string } }) {
  const { order_id } = params;
  const supabase = createClient();
  const { data } = await supabase.from('orders').select().eq('order_id', order_id);
  let order:Order = {
    total: 0,
    created_at: '',
    confirmed_at: '',
    confirmed: false,
    paid: false,
    paid_at: '',
    items: [],
    order_id: '',
    line_id: '',
    payment_option: '',
    account_number: '',
    state: OrderState.NONE,
    customer_id: '',
    tax: 0.0,
  };
  if (data && data.length > 0) {
    [order] = data;
  }

  // async function payOrder(orderId: string, formData: FormData) {
  //   'use server';

  //   console.log(formData);
  //   await supabase.from('orders').update({ paid: true, paid_at: new Date() }).eq('order_id', orderId);
  //   return redirect(`/order/payment/${orderId}`);
  // }
  // const payOrderWithId = payOrder.bind(null, order_id);

  return (
    <div className="lg:col-start-3 lg:row-end-1">
      <h2 className="sr-only">Summary</h2>
      <div className="rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-900/5">
        <dl className="flex flex-wrap">
          <div className="flex-auto pl-6 pt-6">
            <dt className="text-sm font-semibold leading-6 text-gray-900">總金額</dt>
            <dd className="mt-1 text-base font-semibold leading-6 text-gray-900">${order.total}</dd>
          </div>
          <div className="flex-none self-end px-6 pt-4">
            <dt className="sr-only">Status</dt>
            <dd className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              {order.confirmed ? (order.paid ? '已付款' : '尚未付款') : '尚未確認'}
            </dd>
          </div>
          <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6">
            <dt className="flex-none">
              <span className="sr-only">Client</span>
              <UserCircleIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
            </dt>
            <dd className="text-sm font-medium leading-6 text-gray-900">Supranormal-天母店</dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Create date</span>
              <CalendarDaysIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
            </dt>
            <dd className="text-sm leading-6 text-gray-500">
              <time dateTime="2023-01-31">{new Date(order.created_at).toLocaleDateString()}</time>
            </dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Status</span>
              <CreditCardIcon className="h-6 w-5 text-gray-400" aria-hidden="true" />
            </dt>
            {order.items.map(item => (
              <dd key={item.item} className="text-sm leading-6 text-gray-500">{item.item} x {item.units}</dd>
            ))}
          </div>
        </dl>
        {order.paid ? (<div className="mt-6 px-6 py-6"></div>) : (
          <div className="mt-6 border-t border-gray-900/5 px-6 py-6">
            <form action="/api/order/payment" method="POST">
              <input type="hidden" name="order_id" value={order_id} />
              <button type="submit" className="text-sm font-semibold leading-6 text-gray-900">
                立即付款 <span aria-hidden="true">&rarr;</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
