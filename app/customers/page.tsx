'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import {
  MantineProvider,
  Box,
  Group,
  Button,
  Modal,
  Table,
  Checkbox,
  Text,
  Pill,
  Stack,
  TextInput,
  ActionIcon,
  Flex,
} from '@mantine/core';
import { IconTrash, IconSend } from '@tabler/icons-react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import classes from './customers.module.css';
import { BatchImportButton } from '@/components/buttons/BatchImportButton';
import { CustomerModal } from './CustomerModal';
import { CustomerMessageModal } from './CustomerMessageModal';
import { logger, LogAction } from '@/utils/logger';
import { Customer, CustomerWithParent } from '@/utils/db';
import { getAllCustomers, deleteCustomersIn } from './actions';

export default function CustomersPage() {
  const supabase = createClient();
  const [loginUser, setLoginUser] = useState<User>();
  const [rows, setRows] = useState<JSX.Element[]>([]);
  const [search, setSearch] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerWithParent[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState<boolean>(false);
  const [messageOpened, setMessageOpened] = useState<boolean>(false);
  const router = useRouter();

  /*
    Customers
  */
  const paymentOptions = (options: string | null) => {
    if (!options) {
      return '';
    }
    const label:{ [key: string] : string } = {
      monthlyPayment: '月結',
      bankTransfer: '銀行轉帳',
      payOnReceive: '貨到付款',
    };
    return options?.split(',').map((option) => <Pill key={option}>{label[option]}</Pill>);
  };

  useEffect(() => {
    const rs = customers.filter((customer) => customer.name.includes(search)).map((row) => (
      <Table.Tr key={row.customer_id}>
        <Table.Td>
          <Checkbox
            checked={selectedRows.includes(row.customer_id)}
            onChange={() => {
              if (selectedRows.includes(row.customer_id)) {
                setSelectedRows(selectedRows.filter((rec) => rec !== row.customer_id));
              } else {
                setSelectedRows([...selectedRows, row.customer_id]);
              }
            }}
          />
        </Table.Td>
        <Table.Td>{row.customer_id}</Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>{row.parent_name ? (<Pill>{row.parent_name}</Pill>) : ''}</Table.Td>
        <Table.Td>{row.line_group_name}</Table.Td>
        <Table.Td>{[row.contact_phone_1, row.contact_phone_2].filter((x) => x).join(',')}</Table.Td>
        <Table.Td>{row.shipping_address}</Table.Td>
        <Table.Td>{(row.parent_id !== null && row.parent_id !== '') ? ' - ' : paymentOptions(row.payment_options)}</Table.Td>
        <Table.Td w={60}>
          <Text
            td="underline"
            size="xs"
            className="cursor-pointer"
            onClick={() => {
              setSelectedCustomer(row);
              setOpened(true);
          }}>編輯
          </Text>
        </Table.Td>
      </Table.Tr>
    ));
    setRows(rs);
  }, [customers, selectedRows, search]);

  const getCustomers = async () => {
    getAllCustomers().then((results) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('customers', JSON.stringify(results));
      }
      setCustomers(results);
    });
  };

  /* Initial load */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        setLoginUser(JSON.parse(localUser));
        const localCustomers = localStorage.getItem('customers');
        if (localCustomers) {
          setCustomers(JSON.parse(localCustomers));
        }
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        setLoginUser(user);
        getCustomers();
        return null;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('user');
      }
      router.push('/login');
      return null;
    });
  }, []);
  const deleteCustomers = async (customer_ids:string[]) => {
    if (customer_ids.length === 0) {
      return;
    }
    setDeleteLoading(true);
    await deleteCustomersIn(customer_ids);
    logger.info('Delete customers', {
      action: LogAction.DELETE_CUSTOMERS,
      user: {
        user_id: loginUser?.id,
        email: loginUser?.email,
      },
      customers: customer_ids,
    });
    setSelectedRows([]);
    setDeleteLoading(false);
    setDeleteConfirmOpened(false);
    getCustomers();
  };

  // const pageLoading = () => (
  //   <Box className="flex justify-center">
  //     <Loader color="blue" type="dots" className="py-5"></Loader>
  //   </Box>
  // );

  return (
    <MantineProvider>
      <Notifications />
      <>
      <Modal
        size="md"
        opened={deleteConfirmOpened}
        title="刪除客戶"
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => { setDeleteConfirmOpened(false); }}
      >
        <Stack>
          <Text>確認是否要刪除 {selectedRows.length} 筆客戶資料</Text>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={() => deleteCustomers(selectedRows)}>
            確認刪除
          </Button>
        </Stack>
      </Modal>
      <CustomerModal
        opened={opened}
        onClose={() => { setOpened(false); }}
        onChange={() => { getCustomers(); setOpened(false); }}
        customer={selectedCustomer as Customer}
        customers={customers} />
      <CustomerMessageModal
        opened={messageOpened}
        onClose={() => { setMessageOpened(false); }}
        customers={
          customers.filter((customer) => selectedRows.includes(customer.customer_id)) as Customer[]
        }
      />
      <Box className="shadow-sm">
        <header>
          <Flex direction="row" justify="space-between">
            <Group>
              <ActionIcon
                disabled={selectedRows.length === 0}
                variant="outline"
                size="md"
                color="blue"
                aria-label="發送訊息"
                onClick={() => { setMessageOpened(true); }}>
                  <IconSend size={16} stroke={2} />
              </ActionIcon>
              <ActionIcon
                disabled={selectedRows.length === 0}
                variant="outline"
                size="md"
                color="red"
                aria-label="刪除"
                onClick={() => { setDeleteConfirmOpened(true); }}>
                  <IconTrash size={16} stroke={2} />
              </ActionIcon>
              <TextInput
                placeholder="搜尋客戶名稱"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </Group>
            <Group className="py-3 pr-4">
              <Button
                onClick={() => {
                  setSelectedCustomer(null);
                  setOpened(true);
                }}
              >新增客戶
              </Button>
              <BatchImportButton
                label="匯入客戶資料"
                description="匯入資料的格式必須是 CSV，你可以由 Excel 去轉換成 CSV。裡面要包含一些必要的欄位，像是 客戶代號、客戶簡稱、送貨地址、TEL_NO(一)、TEL NO(二)。"
                uploadPath="yslc/customers/upload"
                onImport={() => { getCustomers(); }}
              />
            </Group>
          </Flex>
        </header>
      </Box>
      <Table.ScrollContainer minWidth={700}>
        <Table miw={700} highlightOnHover>
          <Table.Thead className={classes.header}>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedRows(customers.map((customer) => customer.customer_id));
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </Table.Th>
              <Table.Th>客戶代號</Table.Th>
              <Table.Th>客戶簡稱</Table.Th>
              <Table.Th>母公司</Table.Th>
              <Table.Th>Line群</Table.Th>
              <Table.Th>聯絡電話</Table.Th>
              <Table.Th>出貨地址</Table.Th>
              <Table.Th>結帳方式</Table.Th>
              <Table.Th> </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      </>
    </MantineProvider>
  );
}
