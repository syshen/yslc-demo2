import {
  ActionIcon,
  Menu,
  Modal,
  Textarea,
  Button,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconDotsVertical,
  IconTruck,
  IconCalculatorOff,
  IconCash,
  IconSpeakerphone,
  IconChecks,
} from '@tabler/icons-react';
import { Notifications } from '@mantine/notifications';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { OrderState, PaymentState } from '@/utils/types';
import { updateOrderStatus, updatePaymentStatus } from './actions';
import { logger, LogAction } from '@/utils/logger';

export function ActionButton(
  { customer_id, order_id, onAction }
  : { customer_id: string, order_id: string, onAction: () => void }
) {
  const supabase = createClient();
  let user:User | null = null;
  supabase.auth.getUser().then((resp) => {
    user = resp.data.user;
  });
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');

  const changeStatus = async (status: OrderState | PaymentState) => {
    try {
      if (status === PaymentState.PAID) {
        await updatePaymentStatus(order_id, PaymentState.PAID);
        logger.info(`Order ${order_id} payment status changed to ${PaymentState.PAID}`, {
          action: LogAction.CHANGE_STATUS,
          user: {
            user_id: user?.id || '',
            email: user?.email || '',
          },
          order: {
            order_id,
            payment_status: PaymentState.PAID,
          },
          customer: {
            customer_id,
          },
        });
      } else {
        await updateOrderStatus(order_id, status as OrderState);
        logger.info(`Order ${order_id} status changed to ${status}`, {
          action: LogAction.CHANGE_STATUS,
          user: {
            user_id: user?.id || '',
            email: user?.email || '',
          },
          order: {
            order_id,
            status,
          },
          customer: {
            customer_id,
          },
        });
      }
    } catch (error) {
      logger.error(error);
    }
    await onAction();
  };

  const notifyCustomer = async (status: string, payload?:string) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}yslc/message`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          JIDOU_API_KEY: `${process.env.NEXT_PUBLIC_BACKEND_AUTH_HEADER}`,
        },
        body: JSON.stringify({
          action: status,
          order_id,
          customer_id,
          payload,
        }),
      });

      if (resp.status !== 200) {
        throw new Error(resp.statusText);
      }
      Notifications.show({
        title: '通知訊息',
        message: '已通知客戶',
        color: 'green',
      });
      logger.info(`Send message to user for order: ${order_id}`, {
        action: LogAction.SEND_MESSAGE,
        user: {
          user_id: user?.id || '',
          email: user?.email || '',
        },
        order: {
          order_id,
        },
        payload,
        customer: {
          customer_id,
        },
      });
      await onAction();
    } catch (err) {
      Notifications.show({
        title: '通知訊息',
        message: `失敗: ${err}`,
        color: 'red',
      });
      logger.error(err);
    }
  };
  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon
            variant="transparent"
          >
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>改變訂單狀態</Menu.Label>
          <Menu.Item
            leftSection={<IconCash size={14} />}
            onClick={() => changeStatus(PaymentState.PAID)}
          >轉成已付款
          </Menu.Item>
          <Menu.Item
            leftSection={<IconTruck size={14} />}
            onClick={() => changeStatus(OrderState.SHIPPED)}
          >轉成已出貨
          </Menu.Item>
          <Menu.Item
            leftSection={<IconChecks size={14} />}
            onClick={() => changeStatus(OrderState.COMPLETED)}
          >轉成訂單完成
          </Menu.Item>
          <Menu.Item
            leftSection={<IconCalculatorOff size={14} />}
            onClick={() => changeStatus(OrderState.CANCELLED)}
          >取消訂單
          </Menu.Item>

          <Menu.Divider />

          <Menu.Label>訊息通知客戶</Menu.Label>
          <Menu.Item
            leftSection={<IconSpeakerphone size={14} />}
            onClick={() => notifyCustomer('paid')}
          >付款完成通知
          </Menu.Item>
          <Menu.Item
            leftSection={<IconSpeakerphone size={14} />}
            onClick={() => notifyCustomer('shipped')}
          >出貨通知
          </Menu.Item>
          <Menu.Item
            leftSection={<IconSpeakerphone size={14} />}
            onClick={() => setOpened(true)}
          >自訂訊息通知
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Modal
        size="xl"
        opened={opened}
        title="送出訊息給客戶"
        transitionProps={{ duration: 200, transition: 'slide-down' }}
        onClose={() => { setOpened(false); }}>
        <Textarea
          label="訊息內容"
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          className="pb-5"
        >
        </Textarea>
        <Button
          onClick={() => { setOpened(false); notifyCustomer('message', message); }}
        >送出
        </Button>
      </Modal>
    </>
  );
}
