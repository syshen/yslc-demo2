'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload } from '@tabler/icons-react'
import { mkConfig, generateCsv, download } from 'export-to-csv';
import '@mantine/dates/styles.css';
import {
    MantineProvider,
    Table,
    Checkbox,
    Select,
    Group,
    Button,
    Box,
    Loader,
    Text,
    HoverCard,
} from '@mantine/core';
import '@mantine/notifications/styles.css';
import { createClient } from '@/utils/supabase/client';
import classes from './orders.module.css';
import { ChatMessage } from './ChatMessage';
import { Order, OrderItem, PaymentOption, Product } from '@/utils/types';
import { confirmOrder } from '@/app/actions';

const delay = (ms:number) => new Promise(r => { setTimeout(r, ms); });
const recentWeek = ():[Date, Date] => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  return [oneWeekAgo, today];
}

function formatDate(date:Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() 返回 0-11
  const day = date.getDate();

  return `${year}/${month}/${day}`;
};

const csvConfig = mkConfig({
  filename: `匯出訂單-${formatDate(new Date())}`,
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value:string, label:string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(recentWeek());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const copy = (text:string) => {
    navigator.clipboard.writeText(text);
    Notifications.show({
      message: `Copied ${text} to clipboard`,
      color: 'teal',
    });
  };
  const paymentOption = (order:Order) => {
    if (order.payment_option === PaymentOption.BANK_TRANSFER) {
      if (order.account_number) {
        return `銀行轉帳，帳號後五碼: ${order.account_number}`;
      }
      return '銀行轉帳，尚未提供帳號';
    } else if (order.payment_option === PaymentOption.PAY_ON_RECEIVE) {
      return '貨到付款';      
    } else if (order.payment_option === PaymentOption.MONTHLY_PAYMENT) {
      return '月結';
    }
    return '<未指定>';
  };
  
  const getProductById = (id:number) => {
    return products.find((product) => product.product_id === id)
  }

  const getTotalERPQuantity = (quantity:number, id:number) => {
    const product = getProductById(id);
    if (product === null || product === undefined) {
      return '';
    }
    return (quantity * (product.base_unit_quantity || 1)).toString();
  }
  const getGiftQuantity = (quantity:number, id:number) => {
    const product = getProductById(id);
    if (product === null || product === undefined) {
      return '';
    }
    return (quantity * (product.gift_quantity || 0)).toString();
  }

  const getPaymentStatus = (order:Order) => {
    if (order.payment_option === PaymentOption.MONTHLY_PAYMENT) {
      return '月結';
    } else if (order.payment_option === PaymentOption.PAY_ON_RECEIVE) {
      return '貨到付款';
    } else {
      if (order.state === 'completed') {
        return '是';
      } else {
        return '否';
      }
    }
  }

  const exportOrders = () => {
    if (selectedRows.length === 0) {
      return;
    }
    const data:Record<string, string>[] = [];
    orders.forEach((order) => {
      if (selectedRows.includes(order.order_id)) {
        order.items.forEach((item) => {
          data.push({
            '發票型態代號': '',
            '發票型態': '',
            '付款條件代號': '',
            '付款條件': order.payment_option === PaymentOption.MONTHLY_PAYMENT ? '月結' : '緋月結',
            '單據日期': formatDate(new Date(order.created_at)),
            '客戶代號': order.customer_id,
            '客戶簡稱': order.customers?.name || '',
            '物流人員代號': '',
            '業務人員名稱': '',
            '備註': '',
            '送貨地址': order.customers?.shipping_address || '',
            '聯絡電話(一)': order.customers?.contact_phone_1 || '',
            '聯絡電話(二)': order.customers?.contact_phone_2 || '',
            '收貨人': '',
            '訂單單號 (=接單系統的訂單單號)': '',
            '品號': item.id.toString(),
            '品名': item.item,
            '銷貨數量': getTotalERPQuantity(item.quantity, item.id),
            '贈品量': getGiftQuantity(item.quantity, item.id),
            '備品量': '0',
            '單價': item.unit_price.toString(),
            '是否匯款': getPaymentStatus(order),
          });
        });
      }
    });
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  const getCustomers = async () => {
    const { data } = await supabase.from('customers')
      .select(`
        customer_id, 
        name
      `);

    if (data) {
      const rs = data.map((row) => ({
          value: row.customer_id,
          label: row.name,
      }));
      setCustomerOptions(rs);
    }
  };

  const getProducts = async () => {
    const { data } = await supabase.from('products').select(`
      product_id,
      name,
      unit,
      base_unit,
      base_unit_quantity,
      gift_quantity`);
    if (data) {
      setProducts(data);
    }
  }

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
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(row.order_id); }}
          >
            {row.order_id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(row.customers.customer_id); }}
          >
            {row.customers.customer_id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(row.customers.name); }}
          >
            {row.customers.name}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(item.id.toString()); }}
          >
            {item.id}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(item.item); }}
          >
            <HoverCard disabled={!row.messages} width={280} shadow="md">
              <HoverCard.Target>
                <Text>{item.item}</Text>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <ChatMessage
                  userName={row.messages ? row.messages.user_name : ''}
                  profileUrl={row.messages ? row.messages.user_profile_url : ''}
                  message={row.messages ? row.messages.message : ''}
                />
              </HoverCard.Dropdown>
            </HoverCard>
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(item.quantity.toString()); }}
          >
            {item.quantity}
          </Table.Td>
          <Table.Td
            className={row.cancelled ? 'line-through' : ''}
            onClick={() => { copy(item.unit_price.toString()); }}
          >
            {item.unit_price ? item.unit_price.toLocaleString() : ''}
          </Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{paymentOption(row)}</Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{row.total ? Number(row.total).toLocaleString() : ''}</Table.Td>
          <Table.Td className={row.cancelled ? 'line-through' : ''}>{paymentStatus(row)}</Table.Td>
        </Table.Tr>
      ));
    });
    setRows(rs);
  }, [orders, loadingOrder, selectedRows]);

  const getOrders = async () => {
    let func = supabase
      .from('orders')
      .select(`
        *,
        customers (customer_id, name, contact_phone_1, contact_phone_2, shipping_address),
        messages (message_id, user_name, user_profile_url, message)
      `);
    if (!cancelledChecked) {
      func = func.eq('cancelled', false);
    }
    if (!paidChecked) {
      func = func.eq('paid', false);
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
  };

  const doVerifyOrder = async (order_id:string) => {
    setLoadingOrder(order_id);
    await confirmOrder(order_id);
    await delay(2000);
    setLoadingOrder(null);
    await getOrders();
  };

  const paymentStatus = (order:Order) => {
    if (order.payment_option === PaymentOption.BANK_TRANSFER) {
      if (order.paid === true) {
        return '已付款';
      } else {
        if (order.account_number && order.account_number.length > 1) {
          return (
          <Button
            loading={loadingOrder === order.order_id}
            onClick={() => doVerifyOrder(order.order_id)}>
              確認付款完成
          </Button>);
        } else {
          return '待付款';
        }
      }
    } else if (order.payment_option === PaymentOption.PAY_ON_RECEIVE) {
      return '貨到付款';
    } else if (order.payment_option === PaymentOption.MONTHLY_PAYMENT) {
      return '月結';
    }
  };

  const [cancelledChecked, setCancelledChecked] = useState(false);
  const [paidChecked, setPaidChecked] = useState(false);

  useEffect(() => {
    getCustomers();
    getOrders()
  }, [cancelledChecked, paidChecked, selectedCustomer, dateRange]);

  useEffect(() => {
    setPageLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getProducts();
        getCustomers();
        return getOrders()
          .then(() => setPageLoading(false));
      }
      setPageLoading(false);
      router.push('/login');
      return null;
    });
  }, []);

  const loading = () => (
      <Box className="flex justify-center">
        <Loader color="blue" type="dots" className="py-5"></Loader>
      </Box>
    );

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
              <Table.Th>訂單編號</Table.Th>
              <Table.Th>客戶代號</Table.Th>
              <Table.Th>客戶簡稱</Table.Th>
              <Table.Th>品號</Table.Th>
              <Table.Th>品名</Table.Th>
              <Table.Th>銷貨數量</Table.Th>
              <Table.Th>訂單單價</Table.Th>
              <Table.Th>付款方式</Table.Th>
              <Table.Th>訂單總額</Table.Th>
              <Table.Th>付款狀態</Table.Th>
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
            <div className="pr-5">篩選條件:</div>
            <Checkbox
              size="md"
              checked={cancelledChecked}
              label="已取消訂單"
              onChange={(event) => setCancelledChecked(event.currentTarget.checked)}>
            </Checkbox>
            <Checkbox
              size="md"
              checked={paidChecked}
              label="已付款訂單"
              onChange={(event) => setPaidChecked(event.currentTarget.checked)}>
            </Checkbox>
          </Group>
          <Group>
            <DatePickerInput
              size="md"
              type="range"
              allowSingleDateInRange={true}
              highlightToday={true}
              locale="zh_Hant_TW"
              placeholder="選擇查詢區間"
              value={dateRange}
              onChange={ setDateRange }
            />
            <Select
              size="md"
              data={customerOptions}
              clearable
              placeholder="選擇客戶"
              onChange={(customer_id) => { setSelectedCustomer(customer_id); }}
            />
            <Button
              disabled={selectedRows.length === 0}
              leftSection={<IconDownload size={14}/>}
              onClick={() => exportOrders()}
            >匯出
            </Button>
          </Group>
        </div>
        { pageLoading ? loading() : orderTable() }
      </Box>
    </MantineProvider>
  );
}
