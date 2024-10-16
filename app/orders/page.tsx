'use client';

import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload, IconCalculatorOff, IconCash, IconTruck, IconChecks, IconSpeakerphone } from '@tabler/icons-react';
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
import { getCustomers, getProducts, getOrders, updateOrderStatus, updatePaymentStatus } from './actions';
import { PaymentOption, OrderState, PaymentState } from '@/utils/types';
import { ActionButton } from './ActionButton';
import { SendMessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';
import { exportOrders } from './export';
import { logger, LogAction } from '@/utils/logger';

const recentWeek = ():[Date, Date] => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  return [oneWeekAgo, today];
};

enum ActionType {
  CHANGE_PAYMENT_PAID = 'CHANGE_PAYMENT_PAID',
  CHANGE_ORDER_SHIPPED = 'CHANGE_ORDER_SHIPPED',
  CHANGE_ORDER_COMPLETED = 'CHANGE_ORDER_COMPLETED',
  CHANGE_ORDER_CANCELLED = 'CHANGE_ORDER_CANCELLED',
}

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loginUser, setLoginUser] = useState<User>();
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value:string, label:string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(recentWeek());
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [cancelledChecked, setCancelledChecked] = useState(false);
  const [pendingShippingChecked, setPendingShippingChecked] = useState(true);
  const [pendingPaymentChecked, setPendingPaymentChecked] = useState(true);
  const [shippedChecked, setShippedChecked] = useState(true);
  const [pendingConfirmChecked, setPendingConfirmChecked] = useState(false);
  const [testDataChecked, setTestDataChecked] = useState(false);
  const [messageModalOpened, setMessageModalOpened] = useState(false);
  const [confirmModalOpened,
    { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ActionType | null>(null);

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
  const exportSelectedOrders = () => {
    if (selectedRows.length === 0) {
      return;
    }
    exportOrders(orders.filter((order) => selectedRows.includes(order.order_id)), products);
    logger.info('Export orders', {
      action: LogAction.EXPORT_ORDERS,
      user: {
        user_id: loginUser?.id || '',
        email: loginUser?.email || '',
      },
      exported_orders: selectedRows,
    });
  };

  const performConfirmAction = () => {
    switch (confirmAction) {
      case ActionType.CHANGE_PAYMENT_PAID:
        updatePaymentStatus(selectedRows, PaymentState.PAID);
        break;
      case ActionType.CHANGE_ORDER_SHIPPED:
        updateOrderStatus(selectedRows, OrderState.SHIPPED);
        break;
      case ActionType.CHANGE_ORDER_COMPLETED:
        updateOrderStatus(selectedRows, OrderState.COMPLETED);
        break;
      case ActionType.CHANGE_ORDER_CANCELLED:
        updateOrderStatus(selectedRows, OrderState.CANCELLED);
        break;
    }
    reload();
    setSelectedRows([]);
    closeConfirmModal();
  };

  const saveFilter = (name:string, value:boolean) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(name, value.toString());
      // console.log(testDataChecked, localStorage.getItem('filterTestData'));
    }
  };

  useEffect(() => {
    if (orders.length === 0) {
      return;
    }
    const rs = orders.filter((o) => {
      if (!cancelledChecked && o.state === OrderState.CANCELLED) {
        return false;
      }
      if (!pendingPaymentChecked
        && (o.payment_option === PaymentOption.BANK_TRANSFER
        && (
          o.payment_status === PaymentState.PENDING
          || o.payment_status === PaymentState.VERIFYING
        ))) {
        return false;
      }
      if (!pendingShippingChecked
        && (
          (o.payment_option === PaymentOption.BANK_TRANSFER
            && o.payment_status === PaymentState.PAID
            && o.state === OrderState.CONFIRMED)
          || (o.payment_option === PaymentOption.MONTHLY_PAYMENT
            && o.state === OrderState.CONFIRMED)
          || (o.payment_option === PaymentOption.PAY_ON_RECEIVE
            && o.state === OrderState.CONFIRMED)
        )) {
        return false;
      }
      if (!shippedChecked
        && (
          o.state === OrderState.SHIPPED
          || o.state === OrderState.DELIVERED
          || o.state === OrderState.COMPLETED
        )) {
        return false;
      }
      if (!pendingConfirmChecked
        && (o.state === OrderState.NONE || o.state === OrderState.CREATED)) {
        return false;
      }
      if (!testDataChecked && o.customer && o.customer.name && o.customer.name.includes('測試')) {
        return false;
      }
      if (selectedCustomer && o.customer_id !== selectedCustomer) {
        return false;
      }
      return true;
    }).map((row:any) => {
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
                  dateRange,
                ).then((data) => { setOrders(data); });
              }}
            />
          </Table.Td>
        </Table.Tr>
      ));
    });
    setRows(rs);
  }, [
    orders,
    selectedRows,
    products,
    cancelledChecked,
    pendingPaymentChecked,
    pendingShippingChecked,
    shippedChecked,
    selectedCustomer,
    pendingConfirmChecked,
    testDataChecked,
  ]);

  const orderStatus = (order:OrderWithCustomer) => {
    if (order.state === OrderState.NONE || order.state === OrderState.CREATED) {
      return (<Badge fullWidth color="gray" size="lg">未確認</Badge>);
    }
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
      return (<Badge fullWidth color="yellow" size="lg">待付款</Badge>);
    }

    // 月結
    // 貨到付款
    if (order.state === OrderState.CONFIRMED) {
      return (<Badge fullWidth color="yellow" size="lg">待出貨</Badge>);
    }
    return '';
  };

  useEffect(() => {
    reload();
  }, [dateRange]);

  useEffect(() => {
    reloadOrders();
  }, [
    cancelledChecked,
    pendingPaymentChecked,
    pendingShippingChecked,
    shippedChecked,
    selectedCustomer,
    pendingConfirmChecked,
    testDataChecked,
  ]);

  const reloadOrders = async () => {
    const data = await getOrders(dateRange);
    if (data && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('orders', JSON.stringify(data));
    }
    setOrders(data);
  };

  const reload = async () => {
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

    reloadOrders().then(() => {
      nprogress.complete();
    }).catch((err) => {
      Notifications.show({
        title: '錯誤',
        message: `載入訂單失敗: ${err}`,
        color: 'red',
      });
      nprogress.complete();
    });
  };

  const loadFilters = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      let v = localStorage.getItem('filterShipped');
      if (v !== undefined && v !== null) {
        setShippedChecked(v === 'true');
      }
      v = localStorage.getItem('filterPendingShipping');
      if (v !== undefined && v !== null) {
        setPendingShippingChecked(v === 'true');
      }
      v = localStorage.getItem('filterPendingPayment');
      if (v !== undefined && v !== null) {
        setPendingPaymentChecked(v === 'true');
      }
      v = localStorage.getItem('filterCancelled');
      if (v !== undefined && v !== null) {
        setCancelledChecked(v === 'true');
      }
      v = localStorage.getItem('filterPendingConfirm');
      if (v !== undefined && v !== null) {
        setPendingConfirmChecked(v === 'true');
      }
      v = localStorage.getItem('filterTestData');
      if (v !== undefined && v !== null) {
        setTestDataChecked(v === 'true');
      }
    }
  };

  const loadLocalData = () => {
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
  };

  useEffect(() => {
    let interval:NodeJS.Timeout;
    loadLocalData();
    loadFilters();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLoginUser(user);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        reload();

        interval = setInterval(() => reload(), 5 * 60 * 1000);
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
        <Table miw={700}>
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
              <Table.Th style={{ width: '80px' }}>客戶代號</Table.Th>
              <Table.Th>客戶簡稱</Table.Th>
              <Table.Th>品號</Table.Th>
              <Table.Th>品名</Table.Th>
              <Table.Th style={{ width: '80px' }}>銷貨數量</Table.Th>
              <Table.Th style={{ width: '100px' }}>銷售單價</Table.Th>
              <Table.Th style={{ width: '130px' }}>付款方式</Table.Th>
              <Table.Th style={{ width: '100px' }}>訂單總額</Table.Th>
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
          {selectedRows.length === 0 ? (
          <Group gap="md">
            <div className="pr-3">篩選條件:</div>
            <Checkbox
              size="sm"
              checked={shippedChecked}
              label="已出貨"
              onChange={(event) => {
                setShippedChecked(event.currentTarget.checked);
                saveFilter('filterShipped', event.currentTarget.checked);
              }}
            >
            </Checkbox>
            <Checkbox
              size="sm"
              checked={pendingShippingChecked}
              label="待出貨"
              onChange={(event) => {
                setPendingShippingChecked(event.currentTarget.checked);
                saveFilter('filterPendingShipping', event.currentTarget.checked);
              }}
            >
            </Checkbox>
            <Checkbox
              size="sm"
              checked={pendingPaymentChecked}
              label="待付款"
              onChange={(event) => {
                setPendingPaymentChecked(event.currentTarget.checked);
                saveFilter('filterPendingPayment', event.currentTarget.checked);
              }}
            >
            </Checkbox>
            <Checkbox
              size="sm"
              checked={cancelledChecked}
              label="已取消"
              onChange={(event) => {
                setCancelledChecked(event.currentTarget.checked);
                saveFilter('filterCancelled', event.currentTarget.checked);
              }}
            >
            </Checkbox>
            <Checkbox
              size="sm"
              checked={pendingConfirmChecked}
              label="未確認"
              onChange={(event) => {
                setPendingConfirmChecked(event.currentTarget.checked);
                saveFilter('filterPendingConfirm', event.currentTarget.checked);
              }}
            >
            </Checkbox>
            <Checkbox
              size="sm"
              checked={testDataChecked}
              label="測試資料"
              onChange={(event) => {
                setTestDataChecked(event.currentTarget.checked);
                saveFilter('filterTestData', event.currentTarget.checked);
              }}
            >
            </Checkbox>
          </Group>
          ) : (
          <Group gap={10}>
            <div className="pr-3">批次動作:</div>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconCash size={14} />}
              onClick={() => {
                setConfirmAction(ActionType.CHANGE_PAYMENT_PAID);
                setConfirmMessage('確認要將選取的訂單轉為已付款嗎？');
                openConfirmModal();
              }}
            >
              轉已付款
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconTruck size={14} />}
              onClick={() => {
                setConfirmAction(ActionType.CHANGE_ORDER_SHIPPED);
                setConfirmMessage('確認要將選取的訂單轉為已出貨嗎？');
                openConfirmModal();
              }}
            >
              轉已出貨
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconChecks size={14} />}
              onClick={() => {
                setConfirmAction(ActionType.CHANGE_ORDER_COMPLETED);
                setConfirmMessage('確認要將選取的訂單轉為已完成嗎？');
                openConfirmModal();
              }}
            >
              完成訂單
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconCalculatorOff size={14} />}
              onClick={() => {
                setConfirmAction(ActionType.CHANGE_ORDER_CANCELLED);
                setConfirmMessage('確認要將選取的訂單轉為已取消嗎？');
                openConfirmModal();
              }}
            >
              取消訂單
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconSpeakerphone size={14} />}
              onClick={() => { setMessageModalOpened(true); }}
            >
              通知
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() => exportSelectedOrders()}
            >
              匯出
            </Button>
          </Group>
          )}
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
          </Group>
        </div>
        { orderTable() }
      </Box>
      <SendMessageModal
        opened={messageModalOpened}
        onClose={() => setMessageModalOpened(false)}
        orders={selectedRows.map((order_id) => ({ order_id, customer_id: orders.find((order) => order.order_id === order_id)?.customer_id || '' }))}
      />
      <ConfirmModal
        opened={confirmModalOpened}
        onClose={closeConfirmModal}
        onConfirm={performConfirmAction}
        title={confirmMessage || ''}
      />
    </MantineProvider>
  );
}
