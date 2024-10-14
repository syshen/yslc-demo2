/* eslint-disable quote-props */
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { OrderWithCustomer, Product, OrderItem } from '@/utils/database';
import { PaymentOption, OrderState } from '@/utils/types';

function formatDate(date:Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() 返回 0-11
  const day = date.getDate();

  return `${year}/${month}/${day}`;
}

const csvConfig = mkConfig({
  filename: `匯出訂單-${formatDate(new Date())}`,
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

export const exportOrders = (orders:OrderWithCustomer[], products:Product[]) => {
  const getProductById = (id:number) => products.find((product) => product.id === id);

  const getTotalERPQuantity = (quantity:number, id:number) => {
    const product = getProductById(id);
    if (product === null || product === undefined) {
      return '';
    }
    return (quantity * (product.base_unit_quantity || 1)).toString();
  };
  const getGiftQuantity = (item:OrderItem) => {
    const product = getProductById(item.id);
    if (product === null || product === undefined) {
      return '';
    }
    if (!item.gift) {
      return '';
    }
    return (item.gift * product.base_unit_quantity!).toString();
  };

  const getPaymentStatus = (order:OrderWithCustomer) => {
    if (order.payment_option === PaymentOption.MONTHLY_PAYMENT) {
      return '月結';
    }
    if (order.payment_option === PaymentOption.PAY_ON_RECEIVE) {
      return '貨到付款';
    }
    if (order.state === OrderState.COMPLETED) {
      return '是';
    }
    return '否';
  };

  const getUnitPrice = (item:OrderItem) => {
    const product = getProductById(item.id);
    if (product === null || product === undefined) {
      return '';
    }
    return item.price / (product.base_unit_quantity ?? 0);
  };

  const data:Record<string, string>[] = [];
  orders.forEach((order) => {
      order.items.forEach((item) => {
        data.push({
          '發票型態代號': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '2301' : '2302',
          '發票型態': '',
          '付款條件代號': '',
          '付款條件': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '月結' : '非月結',
          '單據日期': formatDate(new Date(order.created_at)),
          '客戶代號': order.customer_id,
          '客戶簡稱': order.customer?.name || '',
          '物流人員代號': '',
          '業務人員名稱': '',
          '備註': '',
          '送貨地址': order.customer?.shipping_address || '',
          '聯絡電話(一)': order.customer?.contact_phone_1 || '',
          '聯絡電話(二)': order.customer?.contact_phone_2 || '',
          '收貨人': '',
          '訂單單號 (=接單系統的訂單單號)': order.order_id,
          '品號': getProductById(item.id)?.product_id.toString() ?? '',
          '品名': item.item,
          '銷貨數量': getTotalERPQuantity(item.quantity, item.id),
          '贈品量': getGiftQuantity(item),
          '備品量': '0',
          '單價': getUnitPrice(item).toString(),
          '是否匯款': getPaymentStatus(order),
        });
      });
      if (order.shipping_fee && order.shipping_fee > 0) {
        data.push({
          '發票型態代號': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '2301' : '2302',
          '發票型態': '',
          '付款條件代號': '',
          '付款條件': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '月結' : '非月結',
          '單據日期': formatDate(new Date(order.created_at)),
          '客戶代號': order.customer_id,
          '客戶簡稱': order.customer?.name || '',
          '物流人員代號': '',
          '業務人員名稱': '',
          '備註': '',
          '送貨地址': order.customer?.shipping_address || '',
          '聯絡電話(一)': order.customer?.contact_phone_1 || '',
          '聯絡電話(二)': order.customer?.contact_phone_2 || '',
          '收貨人': '',
          '訂單單號 (=接單系統的訂單單號)': order.order_id,
          '品號': '',
          '品名': '運費',
          '銷貨數量': '1',
          '贈品量': '',
          '備品量': '',
          '單價': order.shipping_fee.toString(),
          '是否匯款': getPaymentStatus(order),
        });
      }
      if (order.service_fee && order.service_fee > 0) {
        data.push({
          '發票型態代號': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '2301' : '2302',
          '發票型態': '',
          '付款條件代號': '',
          '付款條件': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '月結' : '非月結',
          '單據日期': formatDate(new Date(order.created_at)),
          '客戶代號': order.customer_id,
          '客戶簡稱': order.customer?.name || '',
          '物流人員代號': '',
          '業務人員名稱': '',
          '備註': '',
          '送貨地址': order.customer?.shipping_address || '',
          '聯絡電話(一)': order.customer?.contact_phone_1 || '',
          '聯絡電話(二)': order.customer?.contact_phone_2 || '',
          '收貨人': '',
          '訂單單號 (=接單系統的訂單單號)': order.order_id,
          '品號': '',
          '品名': '收款手續費',
          '銷貨數量': '1',
          '贈品量': '',
          '備品量': '',
          '單價': order.service_fee.toString(),
          '是否匯款': getPaymentStatus(order),
        });
      }
  });
  const csv = generateCsv(csvConfig)(data);
  download(csvConfig)(csv);
};
