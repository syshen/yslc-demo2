import { useState } from 'react';
import { Modal, ModalProps, Textarea, Button, Group, Stack, Text } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { logger } from '@/utils/logger';
import { notify } from '@/utils/notify';

type SendMessageModalProps = {
  orders: { order_id: string, customer_id: string }[],
} & Pick<ModalProps, 'opened' | 'onClose'>;
export function SendMessageModal(
  { orders, ...others }:
  SendMessageModalProps
) {
  const [message, setMessage] = useState('');

  const notifyCustomer = async (sendingMessage:string) => {
    const promises = orders.map(async (order) => {
      let m = sendingMessage.replace('{{order_id}}', order.order_id);
      m = m.replace('{{order_url}}', `${process.env.NEXT_PUBLIC_ORDER_PAGE_URL}?oid=${order.order_id}`);
      return notify({
        action: 'message',
        customer_id: orders[0].customer_id,
        payload: m,
      });
    });

    try {
      await Promise.all(promises);
      Notifications.show({
        title: '通知訊息',
        message: '成功',
        color: 'green',
      });
      logger.info('通知訊息成功');
    } catch (err) {
      Notifications.show({
        title: '通知訊息',
        message: `失敗: ${err}`,
        color: 'red',
      });
      logger.error(err);
    }

    if (others.onClose) {
      setMessage('');
      others.onClose();
    }
  };

  return (
    <Modal
      {...others}
      size="md"
      title="送訊息給訂單客戶"
      transitionProps={{ duration: 200, transition: 'slide-down' }}
    >
      <Stack gap="xl">
        <Stack gap={2}>
          <Text size="sm">使用訊息樣板</Text>
          <Group>
            <Button
              variant="outline"
              onClick={() => {
                setMessage(`訂單完成，預計1-3個工作天到貨喔。

訂單編號：{{order_id}}

訂單明細：{{order_url}}`);
              }}
            >出貨完成通知
            </Button>
          </Group>
        </Stack>
        <Textarea
          label="訊息內容"
          value={message}
          data-autofocus
          autosize
          minRows={5}
          onChange={(event) => setMessage(event.currentTarget.value)}
          className="pb-5"
        >
        </Textarea>
      </Stack>
      <Button
        onClick={() => { notifyCustomer(message); }}
      >送出
      </Button>

    </Modal>
  );
}
