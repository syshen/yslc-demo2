/* eslint-disable quote-props */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload } from '@tabler/icons-react';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { nprogress } from '@mantine/nprogress';
import '@mantine/dates/styles.css';
import {
    MantineProvider,
    Table,
    Checkbox,
    Select,
    Group,
    Button,
    Box,
    Text,
    Badge,
    HoverCard,
} from '@mantine/core';
import '@mantine/notifications/styles.css';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import classes from './orders.module.css';
import { ChatMessage } from './ChatMessage';
import { Product, OrderWithCustomer, OrderItem } from '@/utils/database';
import { getCustomers, getProducts, getOrders } from './actions';
import { PaymentOption, OrderState, PaymentState } from '@/utils/types';
import { ActionButton } from './ActionButton';
import { logger, LogAction } from '@/utils/logger';

const recentWeek = ():[Date, Date] => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  return [oneWeekAgo, today];
};

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

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loginUser, setLoginUser] = useState<User>();
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value:string, label:string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  // const [pageLoading, setPageLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(recentWeek());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const copy = (text:string) => {
    navigator.clipboard.writeText(text);
    Notifications.show({
      message: `Copied ${text} to clipboard`,
      color: 'teal',
    });
  };
  const paymentOption = (order:OrderWithCustomer) => {
    if (order.payment_option === PaymentOption.BANK_TRANSFER) {
      if (order.account_number) {
        if (order.account_message && order.account_message.image_key) {
          return (
          <>
            <Text size="sm">銀行轉帳，帳號後五碼: </Text>
            <a
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'underline' }}
              href={`/image/${order.account_message.image_key}`}>{order.account_number}
            </a>
          </>);
        }
        return `銀行轉帳，帳號後五碼: ${order.account_number}`;
      }
      return '銀行轉帳，尚未提供帳號';
    }
    if (order.payment_option === PaymentOption.PAY_ON_RECEIVE) {
      return '貨到付款';
    }
    if (order.payment_option === PaymentOption.MONTHLY_PAYMENT) {
      return '月結';
    }
    return '<未指定>';
  };

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

  const exportOrders = () => {
    if (selectedRows.length === 0) {
      return;
    }
    const data:Record<string, string>[] = [];
    orders.forEach((order) => {
      if (selectedRows.includes(order.order_id)) {
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
      }
    });
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
    logger.info('Export orders', {
      action: LogAction.EXPORT_ORDERS,
      user: {
        user_id: loginUser?.id || '',
        email: loginUser?.email || '',
      },
      exported_orders: selectedRows,
    });
  };

  useEffect(() => {
    const rs = orders.map((row:any) => {
      if (!row.items) {
        return [];
      }
      return row.items.map((item:OrderItem, idx:number) => (
        <Table.Tr key={idx}>
          <Table.Td>
            <Checkbox
              checked={selectedRows.includes(row.order_id)}
              onChange={() => {
                if (selectedRows.includes(row.order_id)) {
                  setSelectedRows(selectedRows.filter((rec) => rec !== row.order_id));
                } else {
                  setSelectedRows([...selectedRows, row.order_id]);
                }
              }}
            />
          </Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>
            {new Date(row.created_at).toLocaleDateString()}
          </Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>
            {new Date(row.created_at).toLocaleTimeString()}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(row.order_id); }}
          >
            {row.order_id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(row.customer_id); }}
          >
            {row.customer_id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
          >
            {row.customer?.name}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
          >
            {getProductById(item.id)?.product_id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
          >
            <HoverCard disabled={!row.message} width={280} shadow="md">
              <HoverCard.Target>
                <Text>{item.item}</Text>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <ChatMessage
                  userName={row.message ? row.message.user_name : ''}
                  profileUrl={row.message ? row.message.user_profile_url : ''}
                  message={row.message ? row.message.message : ''}
                />
              </HoverCard.Dropdown>
            </HoverCard>
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
          >
            {item.quantity} {item.gift ? `+ ${item.gift}` : ''}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
          >
            {item.price ? item.price.toLocaleString() : ''}
          </Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{paymentOption(row)}</Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{row.total ? Number(row.total).toLocaleString() : ''}</Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{orderStatus(row)}</Table.Td>
          <Table.Td>
            <ActionButton
              customer_id={row.customer_id}
              order_id={row.order_id}
              onAction={() => {
                getOrders(
                  cancelledChecked,
                  pendingPaymentChecked,
                  pendingShippingChecked,
                  shippedChecked,
                  dateRange,
                  selectedCustomer
                ).then((data) => { setOrders(data); });
              }}
            />
          </Table.Td>
        </Table.Tr>
      ));
    });
    setRows(rs);
  }, [orders, selectedRows, products]);

/*
  const getOrders = async () => {
    let func = supabase
      .from('orders')
      .select(`
        *,
        customers (customer_id, name, contact_phone_1, contact_phone_2, shipping_address),
        messages (message_id, user_name, user_profile_url, message)
      `);
    // 是否包含已取消
    if (!cancelledChecked) {
      // filters.push('state.neq.cancelled');
      func = func.neq('state', OrderState.CANCELLED);
    }
    // 是否包含待付款
    if (!pendingPaymentChecked) {
      // !(payment_option = 'bankTransfer' AND payment_status = 'pending')
      // => payment_option != 'bankTransfer' or payment_status != 'pending'
      func = func.or('payment_option.neq.bankTransfer,payment_status.neq.pending');
    }
    // 是否包含待出貨
    if (!pendingShippingChecked) {
      // !(payment_option = 'bankTransfer' AND payment_status = 'paid' AND state = 'confirmed') and
      // !(payment_option = 'monthlyPayment' AND state = 'confirmed') and
      // !(payment_option = 'payOnReceive' AND state = 'confirmed')
      func = func.or('payment_option.neq.bankTransfer,payment_status.neq.paid,state.neq.confirmed')
        .or('payment_option.neq.monthlyPayment,state.neq.confirmed')
        .or('payment_option.neq.payOnReceive,state.neq.confirmed');
    }
    // 不包含已出貨
    if (!shippedChecked) {
      // filters.push('or(state.eq.shipped,state.eq.delivered)');
      func = func.neq('state', OrderState.SHIPPED).neq('state', OrderState.DELIVERED);
    }

    if (dateRange[0]) {
      func = func.gte('created_at', dateRange[0]!.toISOString());
    }
    if (dateRange[1]) {
      func = func.lte('created_at', dateRange[1]!.toISOString());
    }
    if (selectedCustomer && selectedCustomer !== '') {
      func.eq('customer_id', selectedCustomer);
    }
    func = func.order('created_at', { ascending: false });

    const { data } = await func;

    if (data) {
      setOrders(data);
    }
  };*/

  const orderStatus = (order:OrderWithCustomer) => {
    if (order.state === OrderState.SHIPPED) {
      return (<Badge fullWidth color="green" size="lg">已出貨</Badge>);
    }

    if (order.state === OrderState.COMPLETED) {
      return (<Badge fullWidth color="green" size="lg">訂單已完成</Badge>);
    }

    if (order.state === OrderState.CANCELLED) {
      return (<Badge fullWidth color="red" size="lg">已取消</Badge>);
    }

    // 銀行轉帳
    if (order.payment_option === PaymentOption.BANK_TRANSFER) {
      if (order.payment_status === PaymentState.PAID) {
        return (<Badge fullWidth color="yellow" size="lg">待出貨</Badge>);
      }
      if (order.account_number && order.account_number.length > 1) {
        return (<Badge fullWidth color="yellow" size="lg">待確認付款</Badge>);
      }
      return (<Badge fullWidth color="red" size="lg">待付款</Badge>);
    }

    // 月結
    // 貨到付款
    if (order.state === OrderState.CONFIRMED) {
      return (<Badge fullWidth color="yellow" size="lg">待出貨</Badge>);
    }
    return '';
  };

  const [cancelledChecked, setCancelledChecked] = useState(false);
  const [pendingShippingChecked, setPendingShippingChecked] = useState(true);
  const [pendingPaymentChecked, setPendingPaymentChecked] = useState(true);
  const [shippedChecked, setShippedChecked] = useState(true);

  useEffect(() => {
    if (loginUser) {
      getFilteredOrders();
    }
  }, [
    cancelledChecked,
    pendingShippingChecked,
    shippedChecked,
    pendingPaymentChecked,
    selectedCustomer,
    dateRange,
  ]);

  const getFilteredOrders = async () => {
    nprogress.start();
    getCustomers().then((data) => {
      const rs = data.map((row) => ({
        value: row.customer_id,
        label: row.name,
      }));
      setCustomerOptions(rs);
    });
    getProducts().then((data) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('order_products', JSON.stringify(data));
      }
      setProducts(data);
    });
    getOrders(
      cancelledChecked,
      pendingPaymentChecked,
      pendingShippingChecked,
      shippedChecked,
      dateRange,
      selectedCustomer
    ).then((data) => {
      if (data && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('orders', JSON.stringify(data));
      }
      setOrders(data);
      nprogress.complete();
    }).catch((err) => {
      console.error(err);
      nprogress.complete();
    });
  };
  useEffect(() => {
    let interval:NodeJS.Timeout;
    if (typeof window !== 'undefined' && window.localStorage) {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        setLoginUser(JSON.parse(localUser));
        const localOrders = localStorage.getItem('orders');
        if (localOrders) {
          setOrders(JSON.parse(localOrders));
        }
        const localOrderProducts = localStorage.getItem('order_products');
        if (localOrderProducts) {
          setProducts(JSON.parse(localOrderProducts));
        }
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoginUser(user);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        getFilteredOrders();

        interval = setInterval(() => getFilteredOrders(), 5 * 60 * 1000);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('user');
        localStorage.removeItem('orders');
        localStorage.removeItem('order_products');
      }
      router.push('/login');
    });
    return () => clearInterval(interval);
  }, []);

  const orderTable = () => (
      <Table.ScrollContainer minWidth={700}>
        <Table miw={700} highlightOnHover>
          <Table.Thead className={classes.header}>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedRows(orders.map((order) => order.order_id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </Table.Th>
              <Table.Th>銷貨日期</Table.Th>
              <Table.Th>時間</Table.Th>
              <Table.Th>訂單編號</Table.Th>
              <Table.Th>客戶代號</Table.Th>
              <Table.Th>客戶簡稱</Table.Th>
              <Table.Th>品號</Table.Th>
              <Table.Th>品名</Table.Th>
              <Table.Th>銷貨數量</Table.Th>
              <Table.Th>銷售單價</Table.Th>
              <Table.Th>付款方式</Table.Th>
              <Table.Th>訂單總額</Table.Th>
              <Table.Th>訂單狀態</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
  );

  return (
    <MantineProvider>
      <Notifications />
      <Box>
        <div className="flex flex-row m-5 content-center justify-between">
          <Group gap="md">
            <div className="pr-3">篩選條件:</div>
            <Checkbox
              size="sm"
              checked={shippedChecked}
              label="已出貨"
              onChange={(event) => setShippedChecked(event.currentTarget.checked)}>
            </Checkbox>
            <Checkbox
              size="sm"
              checked={pendingShippingChecked}
              label="待出貨"
              onChange={(event) => setPendingShippingChecked(event.currentTarget.checked)}>
            </Checkbox>
            <Checkbox
              size="sm"
              checked={pendingPaymentChecked}
              label="待付款"
              onChange={(event) => setPendingPaymentChecked(event.currentTarget.checked)}>
            </Checkbox>
            <Checkbox
              size="sm"
              checked={cancelledChecked}
              label="已取消"
              onChange={(event) => setCancelledChecked(event.currentTarget.checked)}>
            </Checkbox>
          </Group>
          <Group>
            <DatePickerInput
              size="sm"
              type="range"
              allowSingleDateInRange
              highlightToday
              locale="zh_Hant_TW"
              placeholder="選擇查詢區間"
              value={dateRange}
              onChange={setDateRange}
            />
            <Select
              size="sm"
              data={customerOptions}
              clearable
              placeholder="選擇客戶"
              onChange={(customer_id) => { setSelectedCustomer(customer_id); }}
            />
            <Button
              disabled={selectedRows.length === 0}
              leftSection={<IconDownload size={14} />}
              onClick={() => exportOrders()}
            >匯出
            </Button>
          </Group>
        </div>
        { orderTable() }
      </Box>
    </MantineProvider>
  );
}
