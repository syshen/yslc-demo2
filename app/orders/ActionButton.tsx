import {
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconTruck,
  IconCalculatorOff,
  IconCash,
  IconSpeakerphone,
  IconChecks,
} from '@tabler/icons-react';
import { createClient } from '@/utils/supabase/client';
import { OrderState, PaymentState } from '@/utils/types';

export function ActionButton(
  { order_id, onAction }: { order_id: string, onAction: () => void }
) {
  const supabase = createClient();

  const changeStatus = async (status: string) => {
    if (status === 'paid') {
      await supabase
        .from('orders')
        .update({
          paymentStatus: PaymentState.PAID,
        }).eq('order_id', order_id);
    } else {
      await supabase.from('orders').update({ state: status }).eq('order_id', order_id);
    }
    await onAction();
  };

  const notifyCustomer = async (status: string) => {
    console.log(status);
    await onAction();
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
          {/* <Menu.Item
            leftSection={<IconSpeakerphone size={14} />}
            onClick={() => notifyCustomer('custom')}
          >自訂訊息通知
          </Menu.Item> */}
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
