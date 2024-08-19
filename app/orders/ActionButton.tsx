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
import { createClient } from '@/utils/supabase/client';
import { OrderState, PaymentState } from '@/utils/types';

export function ActionButton(
  { order_id, onAction }: { order_id: string, onAction: () => void }
) {
  const supabase = createClient();
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState('');

  const changeStatus = async (status: string) => {
    if (status === 'paid') {
      await supabase
        .from('orders')
        .update({
          payment_status: PaymentState.PAID,
        }).eq('order_id', order_id);
    } else {
      await supabase.from('orders').update({ state: status }).eq('order_id', order_id);
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
      await onAction();
    } catch (err) {
      Notifications.show({
        title: '通知訊息',
        message: `失敗: ${err}`,
        color: 'red',
      });
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
            onClick={() => changeStatus('paid')}
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
